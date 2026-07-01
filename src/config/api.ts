const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error(
    "EXPO_PUBLIC_API_BASE_URL no está definida. Configúrala en .env o .env.local."
  );
}

// eslint-disable-next-line no-console
console.log(`[VitaCare] API_BASE_URL = ${API_BASE_URL}`);

export { API_BASE_URL };
