import { prestadoresMock } from "@/data/prestadoresMock";
import type { Prestador, SearchPrestadoresParams } from "@/types/prestador";

const SIMULATED_DELAY_MS = 250;

function simulateHttpResponse<T>(factory: () => T): Promise<T> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(factory());
      } catch (error) {
        reject(error);
      }
    }, SIMULATED_DELAY_MS);
  });
}

function normalizeValue(value: string) {
  return value.trim().toLowerCase();
}

function uniqueSorted(values: string[]) {
  return [...new Set(values)].sort((left, right) =>
    left.localeCompare(right, "es"),
  );
}

// Simulación académica del consumo de la API de Prestadores de la Superintendencia de Salud.
export async function getPrestadores(): Promise<Prestador[]> {
  try {
    return await simulateHttpResponse(() => prestadoresMock);
  } catch (error) {
    console.error("Error al obtener prestadores simulados", error);
    return [];
  }
}

// Simulación académica del consumo de la API de Prestadores de la Superintendencia de Salud.
export async function searchPrestadores(
  params: SearchPrestadoresParams,
): Promise<Prestador[]> {
  try {
    return await simulateHttpResponse(() => {
      const query = params.nombre ? normalizeValue(params.nombre) : "";
      const especialidad = params.especialidad
        ? normalizeValue(params.especialidad)
        : "";
      const region = params.region ? normalizeValue(params.region) : "";
      const comuna = params.comuna ? normalizeValue(params.comuna) : "";

      return prestadoresMock.filter((prestador) => {
        const matchesQuery =
          !query ||
          normalizeValue(prestador.nombre).includes(query) ||
          normalizeValue(prestador.especialidad).includes(query) ||
          normalizeValue(prestador.rut).includes(query) ||
          normalizeValue(prestador.registroProfesional).includes(query);
        const matchesEspecialidad =
          !especialidad ||
          normalizeValue(prestador.especialidad).includes(especialidad);
        const matchesRegion =
          !region || normalizeValue(prestador.region).includes(region);
        const matchesComuna =
          !comuna || normalizeValue(prestador.comuna).includes(comuna);

        return (
          matchesQuery && matchesEspecialidad && matchesRegion && matchesComuna
        );
      });
    });
  } catch (error) {
    console.error("Error al buscar prestadores simulados", error);
    return [];
  }
}

// Simulación académica del consumo de la API de Prestadores de la Superintendencia de Salud.
export async function getPrestadorById(id: string): Promise<Prestador | null> {
  try {
    return await simulateHttpResponse(
      () => prestadoresMock.find((prestador) => prestador.id === id) ?? null,
    );
  } catch (error) {
    console.error("Error al obtener el detalle del prestador simulado", error);
    return null;
  }
}

// Simulación académica del consumo de la API de Prestadores de la Superintendencia de Salud.
export async function validarPrestador(valor: string): Promise<Prestador> {
  try {
    return await simulateHttpResponse(() => {
      const normalizedValue = normalizeValue(valor);
      const match = prestadoresMock.find(
        (prestador) =>
          normalizeValue(prestador.rut) === normalizedValue ||
          normalizeValue(prestador.registroProfesional) === normalizedValue,
      );

      if (match) {
        return match;
      }

      return {
        id: `validacion-${normalizedValue || "sin-valor"}`,
        nombre: "Profesional no encontrado",
        rut: valor,
        especialidad: "Sin especialidad",
        registroProfesional: "Sin registro",
        region: "-",
        comuna: "-",
        estadoValidacion: "No encontrado",
        institucion: "-",
        telefono: "-",
        email: "-",
        direccion: "-",
        fechaActualizacion: new Date().toISOString().slice(0, 10),
      };
    });
  } catch (error) {
    console.error("Error al validar prestador simulado", error);
    return {
      id: "validacion-error",
      nombre: "Profesional no encontrado",
      rut: valor,
      especialidad: "Sin especialidad",
      registroProfesional: "Sin registro",
      region: "-",
      comuna: "-",
      estadoValidacion: "No encontrado",
      institucion: "-",
      telefono: "-",
      email: "-",
      direccion: "-",
      fechaActualizacion: new Date().toISOString().slice(0, 10),
    };
  }
}

// Simulación académica del consumo de la API de Prestadores de la Superintendencia de Salud.
export async function getEspecialidades(): Promise<string[]> {
  try {
    return await simulateHttpResponse(() =>
      uniqueSorted(prestadoresMock.map((prestador) => prestador.especialidad)),
    );
  } catch (error) {
    console.error("Error al obtener especialidades simuladas", error);
    return [];
  }
}

// Simulación académica del consumo de la API de Prestadores de la Superintendencia de Salud.
export async function getRegiones(): Promise<string[]> {
  try {
    return await simulateHttpResponse(() =>
      uniqueSorted(prestadoresMock.map((prestador) => prestador.region)),
    );
  } catch (error) {
    console.error("Error al obtener regiones simuladas", error);
    return [];
  }
}

// Simulación académica del consumo de la API de Prestadores de la Superintendencia de Salud.
export async function getComunas(): Promise<string[]> {
  try {
    return await simulateHttpResponse(() =>
      uniqueSorted(prestadoresMock.map((prestador) => prestador.comuna)),
    );
  } catch (error) {
    console.error("Error al obtener comunas simuladas", error);
    return [];
  }
}
