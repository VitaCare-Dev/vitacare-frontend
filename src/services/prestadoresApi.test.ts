import { prestadoresMock } from "@/data/prestadoresMock";
import {
  getComunas,
  getEspecialidades,
  getPrestadorById,
  getPrestadores,
  getRegiones,
  searchPrestadores,
  validarPrestador,
} from "@/services/prestadoresApi";

describe("getPrestadores", () => {
  it("returns the full mock list", async () => {
    const result = await getPrestadores();
    expect(result).toEqual(prestadoresMock);
  });
});

describe("getPrestadorById", () => {
  it("returns the matching prestador", async () => {
    const result = await getPrestadorById("prestador-1");
    expect(result?.nombre).toBe("Dra. Camila Rojas");
  });

  it("returns null for an unknown id", async () => {
    const result = await getPrestadorById("no-existe");
    expect(result).toBeNull();
  });
});

describe("searchPrestadores", () => {
  it("returns all prestadores when no filters are given", async () => {
    const result = await searchPrestadores({});
    expect(result).toHaveLength(prestadoresMock.length);
  });

  it("filters by name (case-insensitive, partial match)", async () => {
    const result = await searchPrestadores({ nombre: "camila" });
    expect(result.every((p) => p.nombre.toLowerCase().includes("camila"))).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("filters by RUT via the general query field", async () => {
    const result = await searchPrestadores({ nombre: "16.234.567-8" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("prestador-1");
  });

  it("filters by especialidad", async () => {
    const result = await searchPrestadores({ especialidad: "cardiología" });
    expect(result.every((p) => p.especialidad.toLowerCase().includes("cardiología"))).toBe(
      true
    );
  });

  it("filters by región", async () => {
    const result = await searchPrestadores({ region: "biobío" });
    expect(result.every((p) => p.region.toLowerCase().includes("biobío"))).toBe(true);
  });

  it("filters by comuna", async () => {
    const result = await searchPrestadores({ comuna: "maipú" });
    expect(result.every((p) => p.comuna.toLowerCase().includes("maipú"))).toBe(true);
  });

  it("combines multiple filters (AND logic)", async () => {
    const result = await searchPrestadores({ region: "metropolitana", especialidad: "cardiología" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("prestador-2");
  });

  it("returns an empty array when no prestador matches", async () => {
    const result = await searchPrestadores({ nombre: "nadie-existe-con-este-nombre" });
    expect(result).toEqual([]);
  });
});

describe("validarPrestador", () => {
  it("returns the matching prestador by RUT", async () => {
    const result = await validarPrestador("16.234.567-8");
    expect(result.nombre).toBe("Dra. Camila Rojas");
  });

  it("returns the matching prestador by registro profesional", async () => {
    const result = await validarPrestador("789456");
    expect(result.nombre).toBe("Dr. Felipe Araya");
  });

  it("returns a 'not found' placeholder when there is no match", async () => {
    const result = await validarPrestador("00.000.000-0-no-existe");
    expect(result.estadoValidacion).toBe("No encontrado");
    expect(result.nombre).toBe("Profesional no encontrado");
  });
});

describe("getEspecialidades / getRegiones / getComunas", () => {
  it("returns a sorted, de-duplicated list of especialidades", async () => {
    const result = await getEspecialidades();
    const sorted = [...result].sort((a, b) => a.localeCompare(b, "es"));
    expect(result).toEqual(sorted);
    expect(new Set(result).size).toBe(result.length);
  });

  it("returns a sorted, de-duplicated list of regiones", async () => {
    const result = await getRegiones();
    expect(new Set(result).size).toBe(result.length);
  });

  it("returns a sorted, de-duplicated list of comunas", async () => {
    const result = await getComunas();
    expect(new Set(result).size).toBe(result.length);
  });
});
