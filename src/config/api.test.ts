describe("api config", () => {
  const originalEnv = process.env.EXPO_PUBLIC_API_BASE_URL;

  afterEach(() => {
    process.env.EXPO_PUBLIC_API_BASE_URL = originalEnv;
    jest.resetModules();
  });

  it("exports the configured API_BASE_URL", () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = "http://test.local";
    let mod: typeof import("@/config/api");
    jest.isolateModules(() => {
      mod = require("@/config/api");
    });
    expect(mod!.API_BASE_URL).toBe("http://test.local");
  });

  it("throws at import time when EXPO_PUBLIC_API_BASE_URL is not set", () => {
    delete process.env.EXPO_PUBLIC_API_BASE_URL;
    expect(() => {
      jest.isolateModules(() => {
        require("@/config/api");
      });
    }).toThrow("EXPO_PUBLIC_API_BASE_URL no está definida. Configúrala en .env o .env.local.");
  });
});
