import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";

import { signInWithGoogle } from "@/services/googleAuth";

jest.mock("@/config/firebase");

jest.mock("@react-native-google-signin/google-signin", () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(),
    signIn: jest.fn(),
    getTokens: jest.fn(),
  },
  isSuccessResponse: (response: { type: string }) => response.type === "success",
}));

jest.mock("firebase/auth", () => ({
  GoogleAuthProvider: { credential: jest.fn().mockReturnValue("the-credential") },
  signInWithCredential: jest.fn(),
}));

const mockHasPlayServices = GoogleSignin.hasPlayServices as jest.Mock;
const mockSignIn = GoogleSignin.signIn as jest.Mock;
const mockGetTokens = GoogleSignin.getTokens as jest.Mock;
const mockSignInWithCredential = signInWithCredential as jest.Mock;
const mockCredential = GoogleAuthProvider.credential as jest.Mock;

describe("signInWithGoogle", () => {
  beforeEach(() => {
    mockHasPlayServices.mockReset().mockResolvedValue(true);
    mockSignIn.mockReset();
    mockGetTokens.mockReset();
    mockSignInWithCredential.mockReset().mockResolvedValue(undefined);
    mockCredential.mockClear();
  });

  it("signs in to Firebase with the Google idToken and returns true", async () => {
    mockSignIn.mockResolvedValue({ type: "success", data: { idToken: "abc123" } });

    const result = await signInWithGoogle();

    expect(mockHasPlayServices).toHaveBeenCalled();
    expect(mockCredential).toHaveBeenCalledWith("abc123");
    expect(mockSignInWithCredential).toHaveBeenCalledWith(expect.anything(), "the-credential");
    expect(result).toBe(true);
  });

  it("returns false without touching Firebase when the user cancels the picker", async () => {
    mockSignIn.mockResolvedValue({ type: "cancelled" });

    const result = await signInWithGoogle();

    expect(result).toBe(false);
    expect(mockSignInWithCredential).not.toHaveBeenCalled();
  });

  it("falls back to GoogleSignin.getTokens() when signIn()'s response has a null idToken", async () => {
    mockSignIn.mockResolvedValue({ type: "success", data: { idToken: null } });
    mockGetTokens.mockResolvedValue({ idToken: "from-get-tokens", accessToken: "x" });

    const result = await signInWithGoogle();

    expect(mockGetTokens).toHaveBeenCalled();
    expect(mockCredential).toHaveBeenCalledWith("from-get-tokens");
    expect(result).toBe(true);
  });

  it("throws when neither signIn() nor getTokens() return an idToken", async () => {
    mockSignIn.mockResolvedValue({ type: "success", data: { idToken: null } });
    mockGetTokens.mockResolvedValue({ idToken: null, accessToken: "x" });

    await expect(signInWithGoogle()).rejects.toThrow("Google no devolvió un idToken.");
    expect(mockSignInWithCredential).not.toHaveBeenCalled();
  });
});
