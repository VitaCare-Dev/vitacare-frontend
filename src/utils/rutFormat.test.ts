import { formatRut, isValidRut } from "@/utils/rutFormat";

describe("formatRut", () => {
  it("returns an empty string for empty input", () => {
    expect(formatRut("")).toBe("");
  });

  it("formats a 7-digit body with thousands separators", () => {
    expect(formatRut("11111111")).toBe("1.111.111-1");
  });

  it("formats an 8-digit body with thousands separators", () => {
    expect(formatRut("111111116")).toBe("11.111.111-6");
  });

  it("uppercases a lowercase 'k' check digit", () => {
    expect(formatRut("111111k")).toBe("111.111-K");
  });

  it("caps the body at 8 digits plus the check digit", () => {
    expect(formatRut("1234567899999")).toBe("12.345.678-9");
  });

  it("shows only the check digit while a single character has been typed", () => {
    expect(formatRut("1")).toBe("1");
  });

  it("strips characters other than digits and k/K", () => {
    expect(formatRut("12.345.678-9")).toBe("12.345.678-9");
  });
});

describe("isValidRut", () => {
  it("accepts a RUT with the correct check digit", () => {
    expect(isValidRut("12345678-5")).toBe(true);
  });

  it("accepts a formatted RUT with dots and dash", () => {
    expect(isValidRut("12.345.678-5")).toBe(true);
  });

  it("accepts a lowercase 'k' check digit", () => {
    // Cuerpo 6 -> suma=12, resto=11-(12%11)=10 -> DV correcto es K.
    expect(isValidRut("6-k")).toBe(true);
  });

  it("rejects a RUT with an incorrect check digit", () => {
    expect(isValidRut("12345678-9")).toBe(false);
  });

  it("rejects an empty string", () => {
    expect(isValidRut("")).toBe(false);
  });

  it("rejects a body that is not numeric", () => {
    expect(isValidRut("abcdefgh-5")).toBe(false);
  });

  it("rejects a single character", () => {
    expect(isValidRut("5")).toBe(false);
  });
});
