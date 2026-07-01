import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Los datos del paciente/mediciones no cambian a cada segundo: evita
      // refetch en cada vez que una pantalla vuelve a tener foco.
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});
