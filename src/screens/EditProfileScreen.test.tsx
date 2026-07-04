import DateTimePicker from "@react-native-community/datetimepicker";
import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";

import { apiGet, apiPut } from "@/services/apiClient";
import EditProfileScreen from "@/screens/EditProfileScreen";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

jest.mock("@/config/firebase");

const mockBack = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack }),
}));

jest.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ status: "authenticated" }),
}));

jest.mock("@/services/apiClient", () => ({
  ...jest.requireActual("@/services/apiClient"),
  apiGet: jest.fn(),
  apiPut: jest.fn(),
}));

const mockApiGet = apiGet as jest.Mock;
const mockApiPut = apiPut as jest.Mock;

const patient = {
  nombre: "María",
  apellidoPaterno: "Pérez",
  apellidoMaterno: "Soto",
  fechaNacimiento: "1990-05-15",
  telefonoPrincipal: "912345678",
  telefonoSecundario: null,
};

async function pickBirthDate(date: Date) {
  fireEvent.press(screen.getByText("Fecha de nacimiento"));
  const picker = screen.UNSAFE_getByType(DateTimePicker);
  await act(async () => picker.props.onValueChange({} as never, date));
}

/** Refleja formatDate() de la pantalla: usa la fecha local, igual que `new Date(fechaNacimiento)`. */
function formatDisplayDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${date.getFullYear()}`;
}

const expectedBirthDate = formatDisplayDate(new Date(patient.fechaNacimiento));

describe("EditProfileScreen", () => {
  beforeEach(() => {
    mockBack.mockClear();
    mockApiGet.mockReset();
    mockApiPut.mockReset();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    (Alert.alert as jest.Mock).mockRestore();
  });

  it(
    "preloads the form with the patient's current data",
    async () => {
      mockApiGet.mockResolvedValue(patient);
      renderWithProviders(<EditProfileScreen />);

      await waitFor(() => expect(screen.getByDisplayValue("María")).toBeTruthy());
      expect(screen.getByDisplayValue("Pérez")).toBeTruthy();
      expect(screen.getByDisplayValue("Soto")).toBeTruthy();
      expect(screen.getByDisplayValue(expectedBirthDate)).toBeTruthy();
      const phoneInputs = screen.getAllByPlaceholderText("8765 4321");
      expect(phoneInputs[0].props.value).toBe("1234 5678");
    },
    10000
  );

  it("submits the updated profile", async () => {
    mockApiGet.mockResolvedValue(patient);
    mockApiPut.mockResolvedValue({});
    renderWithProviders(<EditProfileScreen />);

    await waitFor(() => expect(screen.getByDisplayValue("María")).toBeTruthy());
    fireEvent.changeText(screen.getByDisplayValue("María"), "María José");
    fireEvent.press(screen.getByText("Guardar cambios"));

    await waitFor(() =>
      expect(mockApiPut).toHaveBeenCalledWith(
        "/api/patients/me",
        expect.objectContaining({ nombre: "María José" })
      )
    );
    await waitFor(() => expect(Alert.alert).toHaveBeenCalled());
  });

  it("lets the user change the birth date via the picker", async () => {
    mockApiGet.mockResolvedValue(patient);
    renderWithProviders(<EditProfileScreen />);

    await waitFor(() => expect(screen.getByDisplayValue(expectedBirthDate)).toBeTruthy());
    await pickBirthDate(new Date(1995, 2, 20));
    expect(screen.getByDisplayValue("20/03/1995")).toBeTruthy();
  });

  it("shows an error alert when the update fails", async () => {
    mockApiGet.mockResolvedValue(patient);
    mockApiPut.mockRejectedValue(new Error("network down"));
    renderWithProviders(<EditProfileScreen />);

    await waitFor(() => expect(screen.getByDisplayValue("María")).toBeTruthy());
    fireEvent.press(screen.getByText("Guardar cambios"));

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith("Error", "No se pudo actualizar el perfil.")
    );
  });
});
