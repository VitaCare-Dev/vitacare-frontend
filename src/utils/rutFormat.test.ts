import { formatRut } from "@/utils/rutFormat";

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
