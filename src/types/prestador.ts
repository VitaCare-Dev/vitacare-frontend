export type Prestador = {
  id: string;
  nombre: string;
  rut: string;
  especialidad: string;
  registroProfesional: string;
  region: string;
  comuna: string;
  estadoValidacion: "Validado" | "No encontrado" | "Pendiente";
  institucion: string;
  telefono: string;
  email: string;
  direccion: string;
  fechaActualizacion: string;
};

export type SearchPrestadoresParams = {
  nombre?: string;
  especialidad?: string;
  region?: string;
  comuna?: string;
};
