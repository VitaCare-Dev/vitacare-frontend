import { File, UploadType } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";

import { apiPost, apiPut } from "@/services/apiClient";

type UploadUrlResponse = { uploadUrl: string };

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ["images"],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.8,
};

/**
 * Pide permiso y abre la galería para elegir una foto de perfil.
 *
 * @returns la URI local de la foto elegida, o `null` si el usuario canceló o no dio permiso
 */
export async function pickProfilePhoto(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);

  if (result.canceled || result.assets.length === 0) {
    return null;
  }
  return result.assets[0].uri;
}

/**
 * Pide permiso y abre la cámara para tomar una foto de perfil.
 *
 * @returns la URI local de la foto tomada, o `null` si el usuario canceló o no dio permiso
 */
export async function takeProfilePhoto(): Promise<string | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    return null;
  }

  const result = await ImagePicker.launchCameraAsync(PICKER_OPTIONS);

  if (result.canceled || result.assets.length === 0) {
    return null;
  }
  return result.assets[0].uri;
}

/**
 * Sube la foto de perfil directo a Azure Blob Storage (usando un SAS que
 * genera el BFF) y luego confirma la subida para que quede guardada en el
 * perfil del paciente.
 *
 * Se sube con `File.upload` (de `expo-file-system`) en vez de
 * `fetch(uri).then(r => r.blob())`: en React Native, construir un Blob a
 * partir de la respuesta de un fetch a un archivo local falla con
 * "Creating blobs from 'ArrayBuffer' ... are not supported". `File.upload`
 * sube el archivo directo, sin pasar por esa conversión.
 *
 * @param localUri URI local de la foto ya elegida (ver {@link pickProfilePhoto})
 */
export async function uploadProfilePhoto(localUri: string): Promise<void> {
  const { uploadUrl } = await apiPost<UploadUrlResponse>("/api/patients/me/photo/upload-url");

  const file = new File(localUri);
  const result = await file.upload(uploadUrl, {
    httpMethod: "PUT",
    uploadType: UploadType.BINARY_CONTENT,
    headers: {
      "x-ms-blob-type": "BlockBlob",
      "Content-Type": "image/jpeg",
    },
  });

  if (result.status < 200 || result.status >= 300) {
    throw new Error(`No se pudo subir la foto de perfil (status ${result.status}).`);
  }

  await apiPut("/api/patients/me/photo");
}
