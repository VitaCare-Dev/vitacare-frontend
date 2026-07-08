import { auth } from "@/config/firebase";
import { apiDelete, ApiError, apiGet, apiPatch, apiPost, apiPut, nullOn404 } from "@/services/apiClient";

jest.mock("@/config/firebase");

function mockFetchOnce(response: Partial<Response> & { text: () => Promise<string> }) {
  globalThis.fetch = jest.fn().mockResolvedValue(response as Response);
}

describe("apiClient", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    (auth as { currentUser: unknown }).currentUser = null;
  });

  it("sends no Authorization header when there is no logged-in user", async () => {
    mockFetchOnce({ status: 200, ok: true, text: async () => JSON.stringify({ ok: true }) });
    await apiGet("/api/ping");

    const [, requestInit] = (globalThis.fetch as jest.Mock).mock.calls[0];
    expect(requestInit.headers.Authorization).toBeUndefined();
  });

  it("sends a Bearer Authorization header using the current user's id token", async () => {
    (auth as { currentUser: unknown }).currentUser = {
      getIdToken: jest.fn().mockResolvedValue("abc123"),
    };
    mockFetchOnce({ status: 200, ok: true, text: async () => JSON.stringify({ ok: true }) });
    await apiGet("/api/ping");

    const [, requestInit] = (globalThis.fetch as jest.Mock).mock.calls[0];
    expect(requestInit.headers.Authorization).toBe("Bearer abc123");
  });

  it("uses the provided authTokenOverride instead of the current user", async () => {
    (auth as { currentUser: unknown }).currentUser = {
      getIdToken: jest.fn().mockResolvedValue("should-not-be-used"),
    };
    mockFetchOnce({ status: 204, ok: true, text: async () => "" });
    await apiDelete("/api/patients/me", "override-token");

    const [, requestInit] = (globalThis.fetch as jest.Mock).mock.calls[0];
    expect(requestInit.headers.Authorization).toBe("Bearer override-token");
    expect(requestInit.method).toBe("DELETE");
  });

  it("returns the parsed JSON body on success", async () => {
    mockFetchOnce({
      status: 200,
      ok: true,
      text: async () => JSON.stringify({ nombre: "María" }),
    });
    const result = await apiGet<{ nombre: string }>("/api/patients/me");
    expect(result).toEqual({ nombre: "María" });
  });

  it("returns undefined for a 204 No Content response", async () => {
    mockFetchOnce({ status: 204, ok: true, text: async () => "" });
    const result = await apiDelete("/api/patients/me/addresses/1");
    expect(result).toBeUndefined();
  });

  it("sends a JSON body and Content-Type header for POST requests", async () => {
    mockFetchOnce({ status: 201, ok: true, text: async () => JSON.stringify({ id: 1 }) });
    await apiPost("/api/measurements/glucose", { glucosa: 98 });

    const [, requestInit] = (globalThis.fetch as jest.Mock).mock.calls[0];
    expect(requestInit.method).toBe("POST");
    expect(requestInit.headers["Content-Type"]).toBe("application/json");
    expect(requestInit.body).toBe(JSON.stringify({ glucosa: 98 }));
  });

  it("sends PUT requests with the PUT method", async () => {
    mockFetchOnce({ status: 200, ok: true, text: async () => JSON.stringify({}) });
    await apiPut("/api/patients/me", { nombre: "María" });
    const [, requestInit] = (globalThis.fetch as jest.Mock).mock.calls[0];
    expect(requestInit.method).toBe("PUT");
  });

  it("sends PATCH requests with the PATCH method", async () => {
    mockFetchOnce({ status: 200, ok: true, text: async () => JSON.stringify({}) });
    await apiPatch("/api/medications/1/deactivate");
    const [, requestInit] = (globalThis.fetch as jest.Mock).mock.calls[0];
    expect(requestInit.method).toBe("PATCH");
  });

  it("throws an ApiError using the backend's error message on failure", async () => {
    mockFetchOnce({
      status: 404,
      ok: false,
      text: async () =>
        JSON.stringify({ message: "Paciente no encontrado", status: 404, timestamp: "now" }),
    });
    await expect(apiGet("/api/patients/me")).rejects.toMatchObject({
      name: "ApiError",
      status: 404,
      message: "Paciente no encontrado",
    });
  });

  it("throws a generic ApiError when the failure response has no JSON body", async () => {
    mockFetchOnce({ status: 500, ok: false, text: async () => "" });
    await expect(apiGet("/api/patients/me")).rejects.toMatchObject({
      status: 500,
      message: "Error 500 al llamar /api/patients/me",
    });
  });

  it("throws a connection ApiError when fetch fails outright", async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new Error("Network request failed"));
    await expect(apiGet("/api/patients/me")).rejects.toMatchObject({
      status: 0,
      message: "No se pudo conectar con el servidor al llamar /api/patients/me.",
    });
  });

  it("throws a timeout ApiError when the request is aborted", async () => {
    const abortError = new Error("Aborted");
    abortError.name = "AbortError";
    globalThis.fetch = jest.fn().mockRejectedValue(abortError);
    await expect(apiGet("/api/patients/me")).rejects.toMatchObject({
      status: 0,
      message:
        "Tiempo de espera agotado al llamar /api/patients/me. Verifica tu conexión o intenta de nuevo.",
    });
  });

  describe("nullOn404", () => {
    it("returns the data untouched on success", async () => {
      await expect(nullOn404(Promise.resolve([{ id: 1 }]))).resolves.toEqual([{ id: 1 }]);
    });

    it("maps a 404 to null (the backend confirmed the data does not exist)", async () => {
      await expect(nullOn404(Promise.reject(new ApiError(404, "not found")))).resolves.toBeNull();
    });

    it("re-throws any other error so the screen can show 'no se pudo cargar'", async () => {
      await expect(nullOn404(Promise.reject(new ApiError(500, "boom")))).rejects.toMatchObject({
        status: 500,
      });
      await expect(nullOn404(Promise.reject(new Error("network down")))).rejects.toThrow(
        "network down"
      );
    });
  });
});
