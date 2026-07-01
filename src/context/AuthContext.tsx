import { onAuthStateChanged, type User } from "firebase/auth";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { auth } from "@/config/firebase";
import { ApiError, apiGet } from "@/services/apiClient";

type AuthState =
  | { status: "loading" }
  | { status: "authenticated"; user: User; hasProfile: boolean }
  | { status: "unauthenticated" };

const AuthContext = createContext<AuthState>({ status: "loading" });

/**
 * Referencia al setState de AuthProvider, para poder refrescar hasProfile
 * desde fuera de un componente (ej. justo después de completar el registro
 * de paciente), sin depender del timing de re-render de React.
 */
let currentSetState: React.Dispatch<React.SetStateAction<AuthState>> | null = null;

async function checkHasProfile(): Promise<boolean> {
  try {
    await apiGet("/api/patients/me");
    return true;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return false;
    }
    // Error transitorio (red, 5xx): no bloquear a un usuario ya registrado.
    return true;
  }
}

/** Refresca hasProfile del usuario autenticado actual (no hace nada si no hay sesión). */
export async function refreshAuthProfile(): Promise<void> {
  if (!currentSetState) return;
  const hasProfile = await checkHasProfile();
  currentSetState((prev) => (prev.status === "authenticated" ? { ...prev, hasProfile } : prev));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    currentSetState = setState;
    return () => {
      currentSetState = null;
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setState({ status: "authenticated", user, hasProfile: true });
        checkHasProfile().then((hasProfile) => {
          setState((prev) =>
            prev.status === "authenticated" && prev.user.uid === user.uid
              ? { ...prev, hasProfile }
              : prev
          );
        });
      } else {
        setState({ status: "unauthenticated" });
      }
    });
    return unsubscribe;
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
