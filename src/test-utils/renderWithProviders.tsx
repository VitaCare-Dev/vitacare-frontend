import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderOptions } from "@testing-library/react-native";
import type { ReactElement } from "react";

import { AppThemeProvider } from "@/theme/ThemeContext";

/** Envuelve el componente con los mismos providers que usa la app real (tema, React Query). */
export function renderWithProviders(ui: ReactElement, options?: RenderOptions) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AppThemeProvider>{ui}</AppThemeProvider>
    </QueryClientProvider>,
    options
  );
}
