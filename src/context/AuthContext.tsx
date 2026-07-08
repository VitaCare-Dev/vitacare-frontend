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
  // Firebase ya autenticó al usuario, pero todavía no sabemos si tiene
  // paciente/enfermedad registrados. Es un estado real y necesario, no un
  // detalle interno: sin él, AppNavigator tendría que "adivinar" (asumir que
  // sí tiene perfil) mientras se resuelve la verificación, y esa suposición
  // optimista es exactamente lo que causaba redirigir a Home y luego rebotar
  // de vuelta a /register a mitad del flujo de registro.
  | { status: "checking"; user: User }
  | { status: "authenticated"; user: User; hasProfile: boolean; hasDisease: boolean }
  | { status: "unauthenticated" };

const AuthContext = createContext<AuthState>({ status: "loading" });

/**
 * Referencia al setState de AuthProvider, para poder refrescar hasProfile/hasDisease
 * desde fuera de un componente (ej. justo después de completar el registro
 * de paciente o de elegir la enfermedad), sin depender del timing de re-render de React.
 */
let currentSetState: React.Dispatch<React.SetStateAction<AuthState>> | null = null;

/**
 * Se incrementa cada vez que se inicia una verificación de hasProfile/hasDisease
 * (ya sea automática, al detectar sesión, o explícita vía refreshAuthProfile).
 * Evita que una verificación vieja (ej. la que se dispara justo al crear la
 * cuenta en Firebase, antes de que exista el paciente) pise con un resultado
 * desactualizado el de una verificación más nueva que ya resolvió antes —
 * gana la que se pidió último, no la que responde último.
 */
let checkSequence = 0;

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

/**
 * El BFF no expone un GET que liste las enfermedades del paciente, pero
 * GET /api/patients/me/thresholds solo devuelve datos si ya se registró una
 * enfermedad crónica (los umbrales se derivan de ella) — se usa como proxy.
 */
async function checkHasDisease(): Promise<boolean> {
  try {
    await apiGet("/api/patients/me/thresholds");
    return true;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return false;
    }
    return true;
  }
}

async function checkProfileAndDisease(): Promise<{ hasProfile: boolean; hasDisease: boolean }> {
  const hasProfile = await checkHasProfile();
  if (!hasProfile) {
    return { hasProfile: false, hasDisease: true };
  }
  const hasDisease = await checkHasDisease();
  return { hasProfile, hasDisease };
}

/** Refresca hasProfile/hasDisease del usuario autenticado actual (no hace nada si no hay sesión). */
export async function refreshAuthProfile(): Promise<void> {
  if (!currentSetState) return;
  const mySequence = ++checkSequence;
  const { hasProfile, hasDisease } = await checkProfileAndDisease();
  if (checkSequence !== mySequence) return; // una verificación más nueva ya la reemplazó
  currentSetState((prev) =>
    prev.status === "authenticated" || prev.status === "checking"
      ? { status: "authenticated", user: prev.user, hasProfile, hasDisease }
      : prev
  );
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
        const mySequence = ++checkSequence;
        setState({ status: "checking", user });
        checkProfileAndDisease().then(({ hasProfile, hasDisease }) => {
          if (checkSequence !== mySequence) return; // una verificación más nueva ya la reemplazó
          setState((prev) =>
            (prev.status === "checking" || prev.status === "authenticated") &&
            prev.user.uid === user.uid
              ? { status: "authenticated", user, hasProfile, hasDisease }
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
