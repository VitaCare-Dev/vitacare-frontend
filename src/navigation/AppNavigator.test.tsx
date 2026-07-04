import { render } from "@testing-library/react-native";

import { AppNavigator } from "@/navigation/AppNavigator";
import { AppThemeProvider } from "@/theme/ThemeContext";

jest.mock("@/config/firebase");

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

  it("redirects to register when authenticated without a completed profile", () => {
    mockAuthState = { status: "authenticated", hasProfile: false, hasDisease: false };
    mockSegments = ["(tabs)"];
    renderNavigator();
    expect(mockReplace).toHaveBeenCalledWith("/register");
  });

  it("does not redirect to register when already on the register screen", () => {
    mockAuthState = { status: "authenticated", hasProfile: false, hasDisease: false };
    mockSegments = ["(auth)", "register"];
    renderNavigator();
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
});
