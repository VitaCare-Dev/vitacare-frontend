import { GoogleSignin, isSuccessResponse } from "@react-native-google-signin/google-signin";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";

import { auth } from "@/config/firebase";

GoogleSignin.configure({
  // Necesario para que Google devuelva un idToken utilizable por Firebase
  // (sin esto, GoogleSignin.signIn() igual funciona, pero data.idToken viene null).
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
});

/**
 * Abre el selector nativo de cuentas de Google e inicia sesión en Firebase
 * con la cuenta elegida. Firebase trata el resultado igual que cualquier
 * otro proveedor (crea la cuenta en el primer inicio de sesión).
 *
 * @returns `true` si el usuario completó el inicio de sesión, `false` si canceló el selector
 */
export async function signInWithGoogle(): Promise<boolean> {
  await GoogleSignin.hasPlayServices();
  const response = await GoogleSignin.signIn();

  if (!isSuccessResponse(response)) {
    return false;
  }

  // La respuesta de signIn() a veces trae idToken en null aunque el usuario
  // sí eligió una cuenta (quirk conocido de este módulo). GoogleSignin.getTokens()
  // hace una llamada nativa aparte que sí lo devuelve de forma confiable.
  const idToken = response.data.idToken ?? (await GoogleSignin.getTokens()).idToken;
  if (!idToken) {
    throw new Error("Google no devolvió un idToken.");
  }

  const credential = GoogleAuthProvider.credential(idToken);
  await signInWithCredential(auth, credential);
  return true;
}
