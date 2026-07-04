import {
  extractPhoneDigits,
  formatChileanPhone,
  formatPhoneDigitsForDisplay,
} from "@/utils/phoneFormat";

describe("extractPhoneDigits", () => {
  it("extracts the 8 mobile digits from a full formatted value", () => {
    expect(extractPhoneDigits("+56 9 8765 4321")).toBe("87654321");
  });

  it("strips the country code and mobile prefix if typed by the user", () => {
    expect(extractPhoneDigits("56987654321")).toBe("87654321");
    expect(extractPhoneDigits("987654321")).toBe("87654321");
  });

  it("caps the result at 8 digits", () => {
    expect(extractPhoneDigits("569876543219999")).toBe("87654321");
  });

  it("returns an empty string when there are no digits", () => {
    expect(extractPhoneDigits("")).toBe("");
  });
});

describe("formatChileanPhone", () => {
  it("returns an empty string for empty input (optional fields)", () => {
    expect(formatChileanPhone("")).toBe("");
  });

  it("builds the full prefixed value from raw digits", () => {
    expect(formatChileanPhone("87654321")).toBe("+56 9 8765 4321");
  });

  it("shows a partial value while the user is still typing", () => {
    expect(formatChileanPhone("876")).toBe("+56 9 876");
  });

  it("is idempotent when re-formatting an already formatted value", () => {
    expect(formatChileanPhone("+56 9 8765 4321")).toBe("+56 9 8765 4321");
  });
});

describe("formatPhoneDigitsForDisplay", () => {
  it("groups 8 digits as 'XXXX XXXX'", () => {
    expect(formatPhoneDigitsForDisplay("87654321")).toBe("8765 4321");
  });

  it("does not add a trailing space before the second group exists", () => {
    expect(formatPhoneDigitsForDisplay("8765")).toBe("8765");
  });
});
