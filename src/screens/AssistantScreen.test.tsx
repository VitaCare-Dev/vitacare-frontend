import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";
import { Alert, Keyboard, KeyboardAvoidingView, Platform } from "react-native";

import { apiPost } from "@/services/apiClient";
import AssistantScreen from "@/screens/AssistantScreen";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

jest.mock("@/config/firebase");

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: jest.fn() }),
}));

jest.mock("@/services/apiClient", () => ({
  ...jest.requireActual("@/services/apiClient"),
  apiPost: jest.fn(),
}));

const mockApiPost = apiPost as jest.Mock;

describe("AssistantScreen", () => {
  beforeEach(() => {
    mockApiPost.mockReset();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    (Alert.alert as jest.Mock).mockRestore();
  });

  it(
    "shows the welcome message on mount",
    async () => {
      renderWithProviders(<AssistantScreen />);
      expect(
        screen.getByText("Hola, soy tu asistente de VitaCare. ¿En qué puedo ayudarte hoy?")
      ).toBeTruthy();
    },
    10000
  );

  it("sends a message and renders the assistant's reply", async () => {
    mockApiPost.mockResolvedValue({ respuesta: "Puedes tomar agua y descansar." });
    renderWithProviders(<AssistantScreen />);

    fireEvent.changeText(screen.getByPlaceholderText("Escribe tu mensaje"), "Tengo dolor de cabeza");
    fireEvent.press(screen.getByLabelText("agregar"));

    expect(screen.getByText("Tengo dolor de cabeza")).toBeTruthy();
    await waitFor(() => expect(screen.getByText("Puedes tomar agua y descansar.")).toBeTruthy());
    expect(mockApiPost).toHaveBeenCalledWith(
      "/api/chat",
      { mensaje: "Tengo dolor de cabeza" },
      45000
    );
  });

  it("strips the internal usage-info block from the assistant's reply", async () => {
    mockApiPost.mockResolvedValue({
      respuesta: "Respuesta útil.\n\n--- Información de uso ---\ntokens: 123",
    });
    renderWithProviders(<AssistantScreen />);

    fireEvent.changeText(screen.getByPlaceholderText("Escribe tu mensaje"), "Hola");
    fireEvent.press(screen.getByLabelText("agregar"));

    await waitFor(() => expect(screen.getByText("Respuesta útil.")).toBeTruthy());
    expect(screen.queryByText(/Información de uso/)).toBeNull();
  });

  it("does not send an empty or whitespace-only message", () => {
    renderWithProviders(<AssistantScreen />);
    fireEvent.changeText(screen.getByPlaceholderText("Escribe tu mensaje"), "   ");
    fireEvent.press(screen.getByLabelText("agregar"));
    expect(mockApiPost).not.toHaveBeenCalled();
  });

  it("shows an error alert when the request fails", async () => {
    mockApiPost.mockRejectedValue(new Error("network down"));
    renderWithProviders(<AssistantScreen />);

    fireEvent.changeText(screen.getByPlaceholderText("Escribe tu mensaje"), "Hola");
    fireEvent.press(screen.getByLabelText("agregar"));

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith("Error", "No se pudo contactar al asistente.")
    );
  });

  it("adjusts the bottom padding on Android when the keyboard shows and hides", () => {
    const originalOS = Platform.OS;
    Platform.OS = "android";
    const addListenerSpy = jest.spyOn(Keyboard, "addListener");

    try {
      renderWithProviders(<AssistantScreen />);

      // KeyboardAvoidingView también se suscribe a estos mismos eventos
      // internamente; nuestro propio efecto (en AssistantScreen, el padre)
      // se registra después, así que es la ÚLTIMA coincidencia, no la primera.
      const calls = addListenerSpy.mock.calls;
      const showCallback = [...calls].reverse().find(([eventType]) => eventType === "keyboardDidShow")?.[1];
      const hideCallback = [...calls].reverse().find(([eventType]) => eventType === "keyboardDidHide")?.[1];
      expect(showCallback).toBeDefined();
      expect(hideCallback).toBeDefined();

      act(() => showCallback?.({ endCoordinates: { height: 300 } } as never));
      const avoidingView = screen.UNSAFE_getByType(KeyboardAvoidingView);
      expect(avoidingView.props.style).toEqual(
        expect.arrayContaining([expect.objectContaining({ paddingBottom: 300 })])
      );

      act(() => hideCallback?.(undefined as never));
      expect(screen.UNSAFE_getByType(KeyboardAvoidingView).props.style).toEqual(
        expect.arrayContaining([expect.objectContaining({ paddingBottom: 0 })])
      );
    } finally {
      Platform.OS = originalOS;
      addListenerSpy.mockRestore();
    }
  });

  it("does not attach the Android-only keyboard listeners on iOS", () => {
    const addListenerSpy = jest.spyOn(Keyboard, "addListener");
    renderWithProviders(<AssistantScreen />);
    const androidEventTypes = addListenerSpy.mock.calls.map(([eventType]) => eventType);
    expect(androidEventTypes).not.toContain("keyboardDidShow");
    expect(androidEventTypes).not.toContain("keyboardDidHide");
    addListenerSpy.mockRestore();
  });
});
