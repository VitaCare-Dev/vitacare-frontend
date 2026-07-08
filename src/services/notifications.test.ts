import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * `notifications.ts` decide UNA VEZ, al cargarse, si está en Expo Go (donde
 * expo-notifications no se puede ni importar en Android) usando
 * `Constants.appOwnership`. Para probar ambos caminos hay que recargar el
 * módulo en un registro aislado por cada escenario, con un mock distinto de
 * `expo-constants` (y de `expo-notifications` para el camino "normal").
 */
describe("notifications", () => {
  afterEach(async () => {
    jest.resetModules();
    jest.dontMock("expo-constants");
    jest.dontMock("expo-notifications");
    await AsyncStorage.clear();
  });

  describe("in Expo Go (Android limitation)", () => {
    function loadInExpoGo(): typeof import("@/services/notifications") {
      jest.doMock("expo-constants", () => ({
        __esModule: true,
        default: { appOwnership: "expo" },
        AppOwnership: { Expo: "expo" },
      }));
      let mod!: typeof import("@/services/notifications");
      jest.isolateModules(() => {
        mod = require("@/services/notifications");
      });
      return mod;
    }

    it("reports notificationsAvailable as false", () => {
      const { notificationsAvailable } = loadInExpoGo();
      expect(notificationsAvailable).toBe(false);
    });

    it("requestNotificationPermissions resolves to false with a warning", async () => {
      const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
      const { requestNotificationPermissions } = loadInExpoGo();
      await expect(requestNotificationPermissions()).resolves.toBe(false);
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it("all scheduling functions resolve without throwing", async () => {
      const {
        cancelMedicationReminder,
        scheduleMedicationReminder,
        scheduleTestNotification,
        syncMedicationReminders,
      } = loadInExpoGo();
      await expect(cancelMedicationReminder(1)).resolves.toBeUndefined();
      await expect(
        scheduleMedicationReminder({
          idMedicamento: 1,
          nombreMedicamento: "X",
          dosis: "1",
          frecuenciaHoras: 8,
        })
      ).resolves.toBeUndefined();
      await expect(scheduleTestNotification()).resolves.toBeUndefined();
      await expect(syncMedicationReminders([])).resolves.toBeUndefined();
    });
  });

  describe("outside Expo Go (development build)", () => {
    const mockNotifications = {
      setNotificationHandler: jest.fn(),
      getPermissionsAsync: jest.fn(),
      requestPermissionsAsync: jest.fn(),
      setNotificationChannelAsync: jest.fn(),
      getAllScheduledNotificationsAsync: jest.fn(),
      cancelScheduledNotificationAsync: jest.fn(),
      cancelAllScheduledNotificationsAsync: jest.fn(),
      scheduleNotificationAsync: jest.fn(),
      AndroidImportance: { HIGH: 4 },
      SchedulableTriggerInputTypes: { TIME_INTERVAL: "timeInterval" },
    };

    function loadOutsideExpoGo(): typeof import("@/services/notifications") {
      jest.doMock("expo-constants", () => ({
        __esModule: true,
        default: { appOwnership: null },
        AppOwnership: { Expo: "expo" },
      }));
      jest.doMock("expo-notifications", () => mockNotifications);
      let mod!: typeof import("@/services/notifications");
      jest.isolateModules(() => {
        mod = require("@/services/notifications");
      });
      return mod;
    }

    beforeEach(() => {
      Object.values(mockNotifications).forEach((value) => {
        if (typeof value === "function") (value as jest.Mock).mockReset();
      });
      mockNotifications.getAllScheduledNotificationsAsync.mockResolvedValue([]);
    });

    it("reports notificationsAvailable as true", () => {
      const { notificationsAvailable } = loadOutsideExpoGo();
      expect(notificationsAvailable).toBe(true);
    });

    it("requests permission and creates the Android channel when not yet granted", async () => {
      const { Platform } = require("react-native");
      const originalOS = Platform.OS;
      Platform.OS = "android";
      try {
        mockNotifications.getPermissionsAsync.mockResolvedValue({ status: "undetermined" });
        mockNotifications.requestPermissionsAsync.mockResolvedValue({ status: "granted" });
        const { requestNotificationPermissions } = loadOutsideExpoGo();
        await expect(requestNotificationPermissions()).resolves.toBe(true);
        expect(mockNotifications.requestPermissionsAsync).toHaveBeenCalled();
        expect(mockNotifications.setNotificationChannelAsync).toHaveBeenCalled();
      } finally {
        Platform.OS = originalOS;
      }
    });

    it("does not re-request permission if already granted", async () => {
      mockNotifications.getPermissionsAsync.mockResolvedValue({ status: "granted" });
      const { requestNotificationPermissions } = loadOutsideExpoGo();
      await requestNotificationPermissions();
      expect(mockNotifications.requestPermissionsAsync).not.toHaveBeenCalled();
    });

    it("resolves to false when the user denies permission", async () => {
      mockNotifications.getPermissionsAsync.mockResolvedValue({ status: "undetermined" });
      mockNotifications.requestPermissionsAsync.mockResolvedValue({ status: "denied" });
      const { requestNotificationPermissions } = loadOutsideExpoGo();
      await expect(requestNotificationPermissions()).resolves.toBe(false);
    });

    it("cancels an existing reminder by matching idMedicamento", async () => {
      mockNotifications.getAllScheduledNotificationsAsync.mockResolvedValue([
        { identifier: "abc", content: { data: { idMedicamento: 5 } } },
      ]);
      const { cancelMedicationReminder } = loadOutsideExpoGo();
      await cancelMedicationReminder(5);
      expect(mockNotifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith("abc");
    });

    it("does nothing when no reminder matches the medication id", async () => {
      mockNotifications.getAllScheduledNotificationsAsync.mockResolvedValue([]);
      const { cancelMedicationReminder } = loadOutsideExpoGo();
      await cancelMedicationReminder(999);
      expect(mockNotifications.cancelScheduledNotificationAsync).not.toHaveBeenCalled();
    });

    it("schedules a medication reminder with the right interval in seconds", async () => {
      const { scheduleMedicationReminder } = loadOutsideExpoGo();
      await scheduleMedicationReminder({
        idMedicamento: 1,
        nombreMedicamento: "Metformina",
        dosis: "850 mg",
        frecuenciaHoras: 12,
      });
      expect(mockNotifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          trigger: expect.objectContaining({ seconds: 12 * 3600, repeats: true }),
        })
      );
    });

    it("schedules a 10-second, non-repeating test notification", async () => {
      const { scheduleTestNotification } = loadOutsideExpoGo();
      await scheduleTestNotification();
      expect(mockNotifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          trigger: expect.objectContaining({ seconds: 10, repeats: false }),
        })
      );
    });

    it("cancels reminders for medications no longer active, and schedules missing ones", async () => {
      mockNotifications.getAllScheduledNotificationsAsync.mockResolvedValue([
        { identifier: "stale", content: { data: { idMedicamento: 99 } } },
      ]);
      const { syncMedicationReminders } = loadOutsideExpoGo();
      await syncMedicationReminders([
        { idMedicamento: 1, nombreMedicamento: "X", dosis: "1", frecuenciaHoras: 8 },
      ]);
      expect(mockNotifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith("stale");
      expect(mockNotifications.scheduleNotificationAsync).toHaveBeenCalled();
    });

    it("does not reschedule a medication that already has a reminder", async () => {
      mockNotifications.getAllScheduledNotificationsAsync.mockResolvedValue([
        { identifier: "existing", content: { data: { idMedicamento: 1 } } },
      ]);
      const { syncMedicationReminders } = loadOutsideExpoGo();
      await syncMedicationReminders([
        { idMedicamento: 1, nombreMedicamento: "X", dosis: "1", frecuenciaHoras: 8 },
      ]);
      expect(mockNotifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    });

    it("areNotificationsEnabled defaults to true when nothing was stored yet", async () => {
      const { areNotificationsEnabled } = loadOutsideExpoGo();
      await expect(areNotificationsEnabled()).resolves.toBe(true);
    });

    it("setNotificationsEnabled(false) persists the preference and cancels everything scheduled", async () => {
      const { areNotificationsEnabled, setNotificationsEnabled } = loadOutsideExpoGo();
      await setNotificationsEnabled(false);
      expect(mockNotifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
      await expect(areNotificationsEnabled()).resolves.toBe(false);
    });

    it("setNotificationsEnabled(true) persists the preference without cancelling anything", async () => {
      const { areNotificationsEnabled, setNotificationsEnabled } = loadOutsideExpoGo();
      await setNotificationsEnabled(true);
      expect(mockNotifications.cancelAllScheduledNotificationsAsync).not.toHaveBeenCalled();
      await expect(areNotificationsEnabled()).resolves.toBe(true);
    });

    it("scheduleMedicationReminder does nothing when notifications are disabled", async () => {
      const { scheduleMedicationReminder, setNotificationsEnabled } = loadOutsideExpoGo();
      await setNotificationsEnabled(false);
      mockNotifications.scheduleNotificationAsync.mockClear();

      await scheduleMedicationReminder({
        idMedicamento: 1,
        nombreMedicamento: "X",
        dosis: "1",
        frecuenciaHoras: 8,
      });

      expect(mockNotifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    });
  });
});
