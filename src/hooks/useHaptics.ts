import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export const useHaptics = () => {
  const lightTap = async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      // Ignore errors on web (Haptics not available)
    }
  };

  const mediumTap = async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch {
      // Ignore errors on web
    }
  };

  const heavyTap = async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch {
      // Ignore errors on web
    }
  };

  const successVibration = async () => {
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch {
      // Ignore errors on web
    }
  };

  const errorVibration = async () => {
    try {
      await Haptics.notification({ type: NotificationType.Error });
    } catch {
      // Ignore errors on web
    }
  };

  const selectionChanged = async () => {
    try {
      await Haptics.selectionChanged();
    } catch {
      // Ignore errors on web
    }
  };

  return {
    lightTap,
    mediumTap,
    heavyTap,
    successVibration,
    errorVibration,
    selectionChanged,
  };
};
