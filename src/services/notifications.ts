import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants, { AppOwnership } from "expo-constants";
import type * as NotificationsModule from "expo-notifications";
import { Platform } from "react-native";

const MEDICATION_CHANNEL_ID = "medication-reminders";
const NOTIFICATIONS_ENABLED_KEY = "vitacare:notifications-enabled";

/**
 * expo-notifications lanza un error apenas se IMPORTA en Expo Go para Android
 * (SDK 53+ quitó soporte de push ahí, y el módulo intenta registrar un push
 * token automáticamente al cargarse, no al llamar ninguna función). Por eso
 * se carga de forma perezosa (require, no import estático) y solo fuera de
 * Expo Go — un import estático se evaluaría siempre, sin importar el entorno.
 */
const isExpoGo = Constants.appOwnership === AppOwnership.Expo;

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Notifications: typeof NotificationsModule | null = isExpoGo
  ? null
  : (require("expo-notifications") as typeof NotificationsModule);

export type MedicationForReminder = {
  idMedicamento: number;
  nombreMedicamento: string;
  dosis: string;
  frecuenciaHoras: number;
};

/** false en Expo Go para Android (limitación de la SDK, ver arriba); true en development build / build final. */
export const notificationsAvailable = !isExpoGo;

if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/** Si el usuario dejó activados los recordatorios locales desde su perfil (activado por defecto). */
export async function areNotificationsEnabled(): Promise<boolean> {
  const stored = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
  return stored !== "false";
}

/**
 * Activa/desactiva los recordatorios locales de medicamentos. Al desactivar,
 * cancela de inmediato todo lo que ya estaba programado, sin esperar a que
 * el usuario vuelva a abrir la pantalla de Tratamiento.
 */
export async function setNotificationsEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, String(enabled));
  if (!enabled && Notifications) {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }
}

/** Pide permiso de notificaciones (no hace nada si ya estaba concedido) y crea el canal de Android. */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Notifications) {
    console.warn(
      "[notifications] No disponibles en Expo Go (Android). Usa un development build."
    );
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(MEDICATION_CHANNEL_ID, {
      name: "Recordatorios de medicamentos",
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  return finalStatus === "granted";
}

async function findScheduledNotificationId(idMedicamento: number): Promise<string | null> {
  if (!Notifications) return null;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const match = scheduled.find((item) => item.content.data?.idMedicamento === idMedicamento);
  return match?.identifier ?? null;
}

/** Cancela el recordatorio local de un medicamento, si existe uno programado. */
export async function cancelMedicationReminder(idMedicamento: number): Promise<void> {
  if (!Notifications) return;
  const id = await findScheduledNotificationId(idMedicamento);
  if (id) {
    await Notifications.cancelScheduledNotificationAsync(id);
  }
}

/**
 * Programa un recordatorio local que se repite cada `frecuenciaHoras` horas.
 *
 * No hay un campo de "hora del día" en el medicamento (solo frecuencia en
 * horas), así que el recordatorio se repite desde el momento en que se
 * programa, no en horarios fijos del día (ej. siempre a las 8:00 AM).
 */
export async function scheduleMedicationReminder(medication: MedicationForReminder): Promise<void> {
  if (!Notifications) return;
  if (!(await areNotificationsEnabled())) return;
  await cancelMedicationReminder(medication.idMedicamento);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Hora de tu medicamento",
      body: `${medication.nombreMedicamento} · ${medication.dosis}`,
      data: { idMedicamento: medication.idMedicamento },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: medication.frecuenciaHoras * 3600,
      repeats: true,
      channelId: MEDICATION_CHANNEL_ID,
    },
  });
}

/**
 * Dispara una notificación de prueba en ~10 segundos, sin depender de la
 * frecuencia de ningún medicamento. Solo para verificar que el permiso, el
 * canal y la entrega funcionan en el dispositivo.
 */
export async function scheduleTestNotification(): Promise<void> {
  if (!Notifications) return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Notificación de prueba",
      body: "Si ves esto, las notificaciones locales están funcionando.",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 10,
      repeats: false,
      channelId: MEDICATION_CHANNEL_ID,
    },
  });
}

/**
 * Sincroniza los recordatorios locales con la lista de medicamentos activos:
 * cancela los que ya no correspondan (desactivados/eliminados) y agrega los
 * que falten. Pensado para correr cada vez que se abre la pantalla de
 * Tratamiento, cubriendo el caso de que el dispositivo haya perdido los
 * recordatorios (reinstalación, etc.).
 */
export async function syncMedicationReminders(
  activeMedications: MedicationForReminder[]
): Promise<void> {
  if (!Notifications) return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const activeIds = new Set(activeMedications.map((item) => item.idMedicamento));

  for (const item of scheduled) {
    const scheduledId = item.content.data?.idMedicamento as number | undefined;
    if (scheduledId != null && !activeIds.has(scheduledId)) {
      await Notifications.cancelScheduledNotificationAsync(item.identifier);
    }
  }

  const scheduledIds = new Set(
    scheduled
      .map((item) => item.content.data?.idMedicamento as number | undefined)
      .filter((id): id is number => id != null)
  );
  for (const medication of activeMedications) {
    if (!scheduledIds.has(medication.idMedicamento)) {
      await scheduleMedicationReminder(medication);
    }
  }
}
