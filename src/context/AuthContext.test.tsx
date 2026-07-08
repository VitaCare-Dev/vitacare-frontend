import { act, render, screen, waitFor } from "@testing-library/react-native";
import { Text } from "react-native";

import { AuthProvider, refreshAuthProfile, useAuth } from "@/context/AuthContext";
import { ApiError } from "@/services/apiClient";

jest.mock("@/config/firebase");

let authStateCallback: ((user: unknown) => void) | null = null;

jest.mock("firebase/auth", () => ({
  onAuthStateChanged: (_auth: unknown, callback: (user: unknown) => void) => {
    authStateCallback = callback;
    return jest.fn(); // unsubscribe
  },
}));

jest.mock("@/services/apiClient", () => {
  const actual = jest.requireActual("@/services/apiClient");
  return { ...actual, apiGet: jest.fn() };
});

const { apiGet } = jest.requireMock("@/services/apiClient") as { apiGet: jest.Mock };

function Probe() {
  const auth = useAuth();
  if (auth.status === "loading") return <Text>loading</Text>;
  if (auth.status === "unauthenticated") return <Text>unauthenticated</Text>;
  if (auth.status === "checking") return <Text>checking</Text>;
  return (
    <Text>{`authenticated hasProfile:${auth.hasProfile} hasDisease:${auth.hasDisease}`}</Text>
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    authStateCallback = null;
    apiGet.mockReset();
  });

  it("starts in the loading state before Firebase reports anything", () => {
    apiGet.mockResolvedValue(undefined);
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );
    expect(screen.getByText("loading")).toBeTruthy();
  });

  it("becomes unauthenticated when Firebase reports no user", async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );
    act(() => authStateCallback?.(null));
    await waitFor(() => expect(screen.getByText("unauthenticated")).toBeTruthy());
  });

  it("becomes authenticated with hasProfile/hasDisease true once both checks succeed", async () => {
    apiGet.mockResolvedValue({});
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );
    act(() => authStateCallback?.({ uid: "u1" }));
    await waitFor(() =>
      expect(screen.getByText("authenticated hasProfile:true hasDisease:true")).toBeTruthy()
    );
  });

  it("sets hasProfile to false when /api/patients/me returns a 404", async () => {
    apiGet.mockRejectedValue(new ApiError(404, "not found"));
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );
    act(() => authStateCallback?.({ uid: "u1" }));
    await waitFor(() =>
      expect(screen.getByText("authenticated hasProfile:false hasDisease:true")).toBeTruthy()
    );
  });

  it("sets hasDisease to false when the thresholds endpoint returns a 404, while hasProfile stays true", async () => {
    apiGet.mockImplementation((path: string) => {
      if (path.includes("thresholds")) return Promise.reject(new ApiError(404, "not found"));
      return Promise.resolve({});
    });
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );
    act(() => authStateCallback?.({ uid: "u1" }));
    await waitFor(() =>
      expect(screen.getByText("authenticated hasProfile:true hasDisease:false")).toBeTruthy()
    );
  });

  it("treats a transient (non-404) error as 'has profile' to avoid blocking an already-registered user", async () => {
    apiGet.mockRejectedValue(new Error("network down"));
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );
    act(() => authStateCallback?.({ uid: "u1" }));
    await waitFor(() =>
      expect(screen.getByText("authenticated hasProfile:true hasDisease:true")).toBeTruthy()
    );
  });

  it("refreshAuthProfile updates the mounted provider's state", async () => {
    apiGet.mockResolvedValue({});
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );
    act(() => authStateCallback?.({ uid: "u1" }));
    await waitFor(() =>
      expect(screen.getByText("authenticated hasProfile:true hasDisease:true")).toBeTruthy()
    );

    apiGet.mockRejectedValue(new ApiError(404, "not found"));
    await act(async () => {
      await refreshAuthProfile();
    });
    await waitFor(() =>
      expect(screen.getByText("authenticated hasProfile:false hasDisease:true")).toBeTruthy()
    );
  });

  it("refreshAuthProfile does nothing when no provider is mounted", async () => {
    // No debe lanzar ni requerir un provider activo.
    await expect(refreshAuthProfile()).resolves.toBeUndefined();
  });

  it(
    "does not let a stale check (started right after Firebase login, before the patient exists) " +
      "overwrite a newer refreshAuthProfile result that resolves first",
    async () => {
      let resolveStaleCheck: () => void = () => {};
      const staleCheckGate = new Promise<void>((resolve) => {
        resolveStaleCheck = resolve;
      });

      let callCount = 0;
      apiGet.mockImplementation(() => {
        callCount += 1;
        if (callCount === 1) {
          // La verificación disparada por onAuthStateChanged al crear la cuenta:
          // queda pendiente hasta que el test la libere manualmente, y cuando
          // resuelve, lo hace con el resultado desactualizado (paciente no existe aún).
          return staleCheckGate.then(() => {
            throw new ApiError(404, "not found");
          });
        }
        // La verificación de refreshAuthProfile (tras crear el paciente de verdad) resuelve de inmediato.
        return Promise.resolve({});
      });

      render(
        <AuthProvider>
          <Probe />
        </AuthProvider>
      );
      act(() => authStateCallback?.({ uid: "u1" }));

      // Mientras la verificación vieja sigue pendiente, se completa el registro real.
      await act(async () => {
        await refreshAuthProfile();
      });
      await waitFor(() =>
        expect(screen.getByText("authenticated hasProfile:true hasDisease:true")).toBeTruthy()
      );

      // Ahora resuelve (tarde) la verificación vieja con su resultado obsoleto: no debe pisar el estado correcto.
      await act(async () => {
        resolveStaleCheck();
        await staleCheckGate.catch(() => {});
      });

      expect(screen.getByText("authenticated hasProfile:true hasDisease:true")).toBeTruthy();
    }
  );
});
