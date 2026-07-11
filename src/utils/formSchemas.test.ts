import {
  addMedicationSchema,
  addressSchema,
  changePasswordSchema,
  cholesterolSchema,
  editProfileSchema,
  forgotPasswordSchema,
  glucoseSchema,
  loginSchema,
  registerCredentialsSchema,
  registerPersonalSchema,
  vitalSignsSchema,
} from "@/utils/formSchemas";

describe("loginSchema", () => {
  it("accepts a valid email and non-empty password", () => {
    expect(loginSchema.safeParse({ email: "a@b.cl", password: "x" }).success).toBe(true);
  });

  it("rejects an empty email", () => {
    const result = loginSchema.safeParse({ email: "", password: "x" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email format", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", password: "x" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty password", () => {
    const result = loginSchema.safeParse({ email: "a@b.cl", password: "" });
    expect(result.success).toBe(false);
  });
});

describe("forgotPasswordSchema", () => {
  it("accepts a valid email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "a@b.cl" }).success).toBe(true);
  });

  it("rejects an invalid email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "nope" }).success).toBe(false);
  });
});

describe("registerCredentialsSchema", () => {
  const strongPassword = "Abcdef1!";

  it("accepts matching strong passwords", () => {
    const result = registerCredentialsSchema.safeParse({
      email: "a@b.cl",
      password: strongPassword,
      confirmPassword: strongPassword,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a weak password", () => {
    const result = registerCredentialsSchema.safeParse({
      email: "a@b.cl",
      password: "abc",
      confirmPassword: "abc",
    });
    expect(result.success).toBe(false);
  });

  it("rejects mismatched passwords, flagging confirmPassword", () => {
    const result = registerCredentialsSchema.safeParse({
      email: "a@b.cl",
      password: strongPassword,
      confirmPassword: "Different1!",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["confirmPassword"]);
    }
  });
});

describe("changePasswordSchema", () => {
  const strongPassword = "Abcdef1!";

  it("accepts a valid change with matching new passwords", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "old-pass",
      newPassword: strongPassword,
      confirmNewPassword: strongPassword,
    });
    expect(result.success).toBe(true);
  });

  it("rejects mismatched new passwords", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "old-pass",
      newPassword: strongPassword,
      confirmNewPassword: "Other1234!",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty current password", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "",
      newPassword: strongPassword,
      confirmNewPassword: strongPassword,
    });
    expect(result.success).toBe(false);
  });
});

describe("registerPersonalSchema", () => {
  const validPersonal = {
    rut: "12.345.678-5",
    nombre: "María",
    apellidoPaterno: "Pérez",
    apellidoMaterno: "",
    telefono: "+56 9 8765 4321",
    birthDate: new Date(1990, 0, 1),
  };

  it("accepts a fully valid personal step", () => {
    expect(registerPersonalSchema.safeParse(validPersonal).success).toBe(true);
  });

  it("rejects a missing RUT", () => {
    expect(
      registerPersonalSchema.safeParse({ ...validPersonal, rut: "" }).success
    ).toBe(false);
  });

  it("rejects a RUT with an incorrect check digit", () => {
    expect(
      registerPersonalSchema.safeParse({ ...validPersonal, rut: "12.345.678-9" }).success
    ).toBe(false);
  });

  it("rejects an incomplete phone number", () => {
    expect(
      registerPersonalSchema.safeParse({ ...validPersonal, telefono: "+56 9 876" }).success
    ).toBe(false);
  });

  it("rejects a missing birth date", () => {
    const result = registerPersonalSchema.safeParse({
      ...validPersonal,
      birthDate: undefined,
    });
    expect(result.success).toBe(false);
  });

  it("allows an empty apellidoMaterno (optional)", () => {
    expect(registerPersonalSchema.safeParse(validPersonal).success).toBe(true);
  });
});

describe("addressSchema", () => {
  const validAddress = {
    regionId: "13",
    comunaId: "132",
    calle: "Av. Siempre Viva",
    numero: "123",
  };

  it("accepts a fully filled address", () => {
    expect(addressSchema.safeParse(validAddress).success).toBe(true);
  });

  it.each(["regionId", "comunaId", "calle", "numero"] as const)(
    "rejects when %s is empty",
    (field) => {
      const result = addressSchema.safeParse({ ...validAddress, [field]: "" });
      expect(result.success).toBe(false);
    }
  );
});

describe("editProfileSchema", () => {
  const validProfile = {
    nombre: "María",
    apellidoPaterno: "Pérez",
    apellidoMaterno: "",
    telefonoPrincipal: "+56 9 8765 4321",
    telefonoSecundario: "",
    birthDate: new Date(1990, 0, 1),
  };

  it("accepts a valid profile with an empty optional secondary phone", () => {
    expect(editProfileSchema.safeParse(validProfile).success).toBe(true);
  });

  it("accepts a valid secondary phone when provided", () => {
    const result = editProfileSchema.safeParse({
      ...validProfile,
      telefonoSecundario: "+56 9 1234 5678",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an incomplete secondary phone", () => {
    const result = editProfileSchema.safeParse({
      ...validProfile,
      telefonoSecundario: "+56 9 12",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an incomplete primary phone", () => {
    const result = editProfileSchema.safeParse({
      ...validProfile,
      telefonoPrincipal: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("glucoseSchema", () => {
  it("accepts a valid glucose reading", () => {
    expect(
      glucoseSchema.safeParse({ glucosa: "98", periodo: "En ayunas", notas: "" }).success
    ).toBe(true);
  });

  it("rejects a non-numeric glucose value", () => {
    expect(
      glucoseSchema.safeParse({ glucosa: "abc", periodo: "En ayunas", notas: "" }).success
    ).toBe(false);
  });

  it("rejects a glucose value outside the plausible range", () => {
    expect(
      glucoseSchema.safeParse({ glucosa: "3000", periodo: "En ayunas", notas: "" }).success
    ).toBe(false);
  });

  it("rejects a missing period", () => {
    expect(
      glucoseSchema.safeParse({ glucosa: "98", periodo: "", notas: "" }).success
    ).toBe(false);
  });
});

describe("vitalSignsSchema", () => {
  it("accepts valid temperature and weight without blood pressure", () => {
    const result = vitalSignsSchema.safeParse({
      sistolica: "",
      diastolica: "",
      temperatura: "36.6",
      peso: "65",
      notas: "",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid blood pressure alongside temperature and weight", () => {
    const result = vitalSignsSchema.safeParse({
      sistolica: "120",
      diastolica: "80",
      temperatura: "36.6",
      peso: "65",
      notas: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects blood pressure with only the systolic value filled in", () => {
    const result = vitalSignsSchema.safeParse({
      sistolica: "120",
      diastolica: "",
      temperatura: "36.6",
      peso: "65",
      notas: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.includes("diastolica"))).toBe(true);
    }
  });

  it("rejects blood pressure with only the diastolic value filled in", () => {
    const result = vitalSignsSchema.safeParse({
      sistolica: "",
      diastolica: "80",
      temperatura: "36.6",
      peso: "65",
      notas: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a systolic value outside the plausible range", () => {
    const result = vitalSignsSchema.safeParse({
      sistolica: "9",
      diastolica: "80",
      temperatura: "36.6",
      peso: "65",
      notas: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a diastolic value outside the plausible range", () => {
    const result = vitalSignsSchema.safeParse({
      sistolica: "120",
      diastolica: "500",
      temperatura: "36.6",
      peso: "65",
      notas: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a temperature outside the plausible range", () => {
    const result = vitalSignsSchema.safeParse({
      sistolica: "",
      diastolica: "",
      temperatura: "90",
      peso: "65",
      notas: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("cholesterolSchema", () => {
  const validCholesterol = {
    colesterolTotal: "200",
    ldl: "130",
    hdl: "40",
    triglyceridos: "150",
    notas: "",
  };

  it("accepts a fully valid lipid profile", () => {
    expect(cholesterolSchema.safeParse(validCholesterol).success).toBe(true);
  });

  it.each(["colesterolTotal", "ldl", "hdl", "triglyceridos"] as const)(
    "rejects when %s is out of range",
    (field) => {
      const result = cholesterolSchema.safeParse({ ...validCholesterol, [field]: "99999" });
      expect(result.success).toBe(false);
    }
  );
});

describe("addMedicationSchema", () => {
  const validMedication = {
    medicationName: "Metformina",
    dose: "850 mg",
    frequencyHours: "12",
    startDate: new Date(2026, 0, 1),
    endDate: null,
  };

  it("accepts a valid medication without an end date", () => {
    expect(addMedicationSchema.safeParse(validMedication).success).toBe(true);
  });

  it("accepts a valid medication with an end date", () => {
    const result = addMedicationSchema.safeParse({
      ...validMedication,
      endDate: new Date(2026, 5, 1),
    });
    expect(result.success).toBe(true);
  });

  it("rejects a non-numeric frequency", () => {
    expect(
      addMedicationSchema.safeParse({ ...validMedication, frequencyHours: "abc" }).success
    ).toBe(false);
  });

  it("rejects a zero or negative frequency", () => {
    expect(
      addMedicationSchema.safeParse({ ...validMedication, frequencyHours: "0" }).success
    ).toBe(false);
  });

  it("rejects a missing start date", () => {
    expect(
      addMedicationSchema.safeParse({ ...validMedication, startDate: undefined }).success
    ).toBe(false);
  });
});
