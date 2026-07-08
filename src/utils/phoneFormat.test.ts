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

  it("keeps a leading 9 when it's part of the 8 subscriber digits (not a prefix)", () => {
    // Celulares como +56 9 9843 7654 existen: el primer "9" tipeado no debe
    // descartarse como si fuera el prefijo del formato.
    expect(extractPhoneDigits("9")).toBe("9");
    expect(extractPhoneDigits("98437654")).toBe("98437654");
  });

  it("keeps a leading 56 when it's part of the 8 subscriber digits (not the country code)", () => {
    expect(extractPhoneDigits("56")).toBe("56");
    expect(extractPhoneDigits("56123456")).toBe("56123456");
  });

  it("still strips prefixes from a pasted full number that starts with 9 or 56", () => {
    expect(extractPhoneDigits("+56 9 9843 7654")).toBe("98437654");
    expect(extractPhoneDigits("+56 9 5612 3456")).toBe("56123456");
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
