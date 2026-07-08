import { render } from "@testing-library/react-native";

import { AppNavigator } from "@/navigation/AppNavigator";
import { AppThemeProvider } from "@/theme/ThemeContext";

jest.mock("@/config/firebase");

const mockSignOut = jest.fn().mockResolvedValue(undefined);
jest.mock("firebase/auth", () => ({
  signOut: (...args: unknown[]) => mockSignOut(...args),
}));

const mockReplace = jest.fn();
let mockSegments: string[] = [];
jest.mock("expo-router", () => {
  const react = require("react");
  const { View } = require("react-native");
  return {
    useRouter: () => ({ replace: mockReplace }),
    useSegments: () => mockSegments,
    Stack: Object.assign(
      ({ children }: { children?: React.ReactNode }) =>
        react.createElement(View, null, children),
      { Screen: () => null }
    ),
  };
});

let mockAuthState: Record<string, unknown> = { status: "loading" };
jest.mock("@/context/AuthContext", () => ({
  useAuth: () => mockAuthState,
}));

function renderNavigator() {
  return render(
    <AppThemeProvider>
      <AppNavigator />
    </AppThemeProvider>
  );
}

describe("AppNavigator", () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockSignOut.mockClear();
    mockSegments = [];
  });

  it("renders nothing while the auth state is loading", () => {
    mockAuthState = { status: "loading" };
    const { toJSON } = renderNavigator();
    expect(toJSON()).toBeNull();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("redirects to login when unauthenticated and outside the auth group", () => {
    mockAuthState = { status: "unauthenticated" };
    mockSegments = ["(tabs)"];
    renderNavigator();
    expect(mockReplace).toHaveBeenCalledWith("/(auth)/login");
  });

  it("does not redirect when unauthenticated but already inside the auth group", () => {
    mockAuthState = { status: "unauthenticated" };
    mockSegments = ["(auth)", "login"];
    renderNavigator();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it(
    "redirects to /register (without signing out) when authenticated without a patient, even " +
      "for an account that already signed in before — antes se cerraba la sesión de esas " +
      "cuentas 'huérfanas', lo que las dejaba bloqueadas para siempre sin poder registrarse",
    () => {
      mockAuthState = {
        status: "authenticated",
        hasProfile: false,
        hasDisease: false,
        user: { metadata: { creationTime: "2026-01-01", lastSignInTime: "2026-07-08" } },
      };
      mockSegments = ["(tabs)"];
      renderNavigator();
      expect(mockSignOut).not.toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith("/register");
    }
  );

  it(
    "redirects to /register when it's the account's very first sign-in " +
      "(ej. recién se autenticó con Google y todavía no existe el paciente)",
    () => {
      mockAuthState = {
        status: "authenticated",
        hasProfile: false,
        hasDisease: false,
        user: { metadata: { creationTime: "2026-07-08", lastSignInTime: "2026-07-08" } },
      };
      mockSegments = ["(tabs)"];
      renderNavigator();
      expect(mockSignOut).not.toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith("/register");
    }
  );

  it("does not sign out while the real signup flow is still on the register screen", () => {
    mockAuthState = {
      status: "authenticated",
      hasProfile: false,
      hasDisease: false,
      user: { metadata: { creationTime: "2026-01-01", lastSignInTime: "2026-07-08" } },
    };
    mockSegments = ["(auth)", "register"];
    renderNavigator();
    expect(mockSignOut).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("redirects to select-disease when the profile is complete but no disease is set", () => {
    mockAuthState = { status: "authenticated", hasProfile: true, hasDisease: false };
    mockSegments = ["(tabs)"];
    renderNavigator();
    expect(mockReplace).toHaveBeenCalledWith("/select-disease");
  });

  it("redirects to home once profile and disease are both set, if still in the auth group", () => {
    mockAuthState = { status: "authenticated", hasProfile: true, hasDisease: true };
    mockSegments = ["(auth)", "login"];
    renderNavigator();
    expect(mockReplace).toHaveBeenCalledWith("/(tabs)/home");
  });

  it("does not redirect when fully authenticated and already outside the auth group", () => {
    mockAuthState = { status: "authenticated", hasProfile: true, hasDisease: true };
    mockSegments = ["(tabs)"];
    renderNavigator();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it(
    "does not redirect while 'checking' (Firebase authenticated but hasProfile/hasDisease not " +
      "resolved yet) — regression test for the register-screen flash bug",
    () => {
      mockAuthState = { status: "checking" };
      mockSegments = ["(auth)", "register"];
      renderNavigator();
      expect(mockReplace).not.toHaveBeenCalled();
    }
  );

  it(
    "keeps rendering the navigator (does not unmount it) while 'checking' — unmounting here " +
      "was itself a bug: it tore down RegisterScreen mid-signup, right when Firebase login " +
      "triggers the profile check, corrupting the in-progress registration",
    () => {
      mockAuthState = { status: "checking" };
      mockSegments = ["(auth)", "register"];
      const { toJSON } = renderNavigator();
      expect(toJSON()).not.toBeNull();
    }
  );
});
