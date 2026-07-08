import { auth } from "@/config/firebase";
import { API_BASE_URL } from "@/config/api";

/** Espejo de ErrorResponseDto, devuelto por los 6 microservicios y el BFF. */
interface ErrorResponseDto {
  message: string;
  status: number;
  timestamp: string;
}

export class ApiError extends Error {
  status: number;
  body?: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface ApiRequestOptions {
  method?: HttpMethod;
  body?: unknown;
  timeoutMs?: number;
  /** Token a usar en vez de leer `auth.currentUser` (ej. tras borrar la cuenta de Firebase, cuando ya no queda un usuario activo del que leer un token). */
  authTokenOverride?: string;
}

/** fetch en React Native no tiene timeout por defecto: sin esto, una request
 * que nunca resuelve (cold start, servicio caído, red mala) deja la pantalla
 * cargando para siempre en vez de mostrar un error. */
const REQUEST_TIMEOUT_MS = 10000;

async function getAuthHeader(tokenOverride?: string): Promise<Record<string, string>> {
  if (tokenOverride) {
    return { Authorization: `Bearer ${tokenOverride}` };
  }
  const user = auth.currentUser;
  if (!user) {
    return {};
  }
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { method = "GET", body, timeoutMs = REQUEST_TIMEOUT_MS, authTokenOverride } = options;

  const headers: Record<string, string> = {
    ...(await getAuthHeader(authTokenOverride)),
  };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError(0, `Tiempo de espera agotado al llamar ${path}. Verifica tu conexión o intenta de nuevo.`);
    }
    throw new ApiError(0, `No se pudo conectar con el servidor al llamar ${path}.`);
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : undefined;

  if (!response.ok) {
    const errorBody = data as ErrorResponseDto | undefined;
    throw new ApiError(
      response.status,
      errorBody?.message ?? `Error ${response.status} al llamar ${path}`,
      data
    );
  }

  return data as T;
}

export function apiGet<T>(path: string): Promise<T> {
  return apiRequest<T>(path);
}

export function apiPost<T>(path: string, body?: unknown, timeoutMs?: number): Promise<T> {
  return apiRequest<T>(path, { method: "POST", body, timeoutMs });
}

export function apiPut<T>(path: string, body?: unknown): Promise<T> {
  return apiRequest<T>(path, { method: "PUT", body });
}

export function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  return apiRequest<T>(path, { method: "PATCH", body });
}

export function apiDelete<T = void>(path: string, authTokenOverride?: string): Promise<T> {
  return apiRequest<T>(path, { method: "DELETE", authTokenOverride });
}
