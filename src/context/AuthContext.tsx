import { onAuthStateChanged, type User } from "firebase/auth";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { auth } from "@/config/firebase";
import { queryClient } from "@/config/queryClient";
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

/**
 * Verifica si un recurso del paciente existe: `true` si el GET responde,
 * `false` solo si el backend confirma con un 404 que no existe.
 *
 * Ante un error transitorio (red, 5xx) se reintenta una vez — un parpadeo de
 * conexión no debería decidir el gating de navegación. Si el reintento
 * también falla, se asume `true` (optimista): la alternativa sería mandar a
 * un usuario ya registrado a la pantalla de registro por un problema de red,
 * que es peor. Las pantallas muestran su propio estado de error honesto
 * ("no se pudo cargar" / barra offline), así que el optimismo de este check
 * no le afirma datos falsos al usuario.
 */
async function endpointExists(path: string, attempts = 2): Promise<boolean> {
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      await apiGet(path);
      return true;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return false;
      }
      // Transitorio: probar de nuevo; si se agotan los intentos, optimista.
    }
  }
  return true;
}

function checkHasProfile(): Promise<boolean> {
  return endpointExists("/api/patients/me");
}

/**
 * El BFF no expone un GET que liste las enfermedades del paciente, pero
 * GET /api/patients/me/thresholds solo devuelve datos si ya se registró una
 * enfermedad crónica (los umbrales se derivan de ella) — se usa como proxy.
 */
function checkHasDisease(): Promise<boolean> {
  return endpointExists("/api/patients/me/thresholds");
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
        // Al quedar sin sesión (logout o cuenta eliminada) se borra todo el
        // caché de datos: con staleTime de 5 min, si otra persona inicia
        // sesión en el mismo teléfono dentro de esa ventana, vería los datos
        // médicos del usuario anterior servidos directo desde el caché.
        queryClient.clear();
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
