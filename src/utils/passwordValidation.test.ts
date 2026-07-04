import { getPasswordRequirementErrors, isPasswordValid } from "@/utils/passwordValidation";

describe("getPasswordRequirementErrors", () => {
  it("returns no errors for a password meeting every requirement", () => {
    expect(getPasswordRequirementErrors("Abcdef1!")).toEqual([]);
  });

  it("flags a password that is too short", () => {
    expect(getPasswordRequirementErrors("Ab1!")).toContain("al menos 8 caracteres");
  });

  it("flags a missing uppercase letter", () => {
    expect(getPasswordRequirementErrors("abcdefg1!")).toContain("una letra mayúscula");
  });

  it("flags a missing lowercase letter", () => {
    expect(getPasswordRequirementErrors("ABCDEFG1!")).toContain("una letra minúscula");
  });

  it("flags a missing number", () => {
    expect(getPasswordRequirementErrors("Abcdefgh!")).toContain("un número");
  });

  it("flags a missing special character", () => {
    expect(getPasswordRequirementErrors("Abcdefg1")).toContain("un carácter especial");
  });

  it("flags every unmet requirement at once", () => {
    expect(getPasswordRequirementErrors("abc")).toEqual([
      "al menos 8 caracteres",
      "una letra mayúscula",
      "un número",
      "un carácter especial",
    ]);
  });
});

describe("isPasswordValid", () => {
  it("returns true when all requirements are met", () => {
    expect(isPasswordValid("Abcdef1!")).toBe(true);
  });

  it("returns false when any requirement is missing", () => {
    expect(isPasswordValid("abcdefgh")).toBe(false);
  });
});
