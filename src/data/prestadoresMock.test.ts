import { prestadoresMock } from "@/data/prestadoresMock";

describe("prestadoresMock", () => {
  it("exposes 8 mock prestadores", () => {
    expect(prestadoresMock).toHaveLength(8);
  });

  it("includes at least one prestador in each validation state", () => {
    const states = prestadoresMock.map((prestador) => prestador.estadoValidacion);
    expect(states).toContain("Validado");
    expect(states).toContain("Pendiente");
    expect(states).toContain("No encontrado");
  });

  it("gives every prestador a unique id", () => {
    const ids = prestadoresMock.map((prestador) => prestador.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
