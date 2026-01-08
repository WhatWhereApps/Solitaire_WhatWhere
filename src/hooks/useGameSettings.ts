import { useState, useEffect, useCallback } from 'react';

export type CardBackDesign = 'classic-blue' | 'classic-red' | 'royal-purple' | 'forest-green' | 'midnight';
export type VibrationIntensity = 'off' | 'light' | 'medium' | 'heavy';
export type HandPreference = 'left' | 'right';

export interface GameSettings {
  soundEnabled: boolean;
  vibrationIntensity: VibrationIntensity;
  cardBackDesign: CardBackDesign;
  handPreference: HandPreference;
}

const DEFAULT_SETTINGS: GameSettings = {
  soundEnabled: true,
  vibrationIntensity: 'medium',
  cardBackDesign: 'classic-blue',
  handPreference: 'right',
};

const STORAGE_KEY = 'solitaire-settings';

export const useGameSettings = () => {
  const [settings, setSettings] = useState<GameSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch {
      // Ignore parse errors
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Ignore storage errors
    }
  }, [settings]);

  const updateSetting = useCallback(<K extends keyof GameSettings>(
    key: K,
    value: GameSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  return {
    settings,
    updateSetting,
    resetSettings,
  };
};

// Card back design configurations using CSS variables
export const cardBackDesigns: Record<CardBackDesign, { name: string; cssVar: string }> = {
  'classic-blue': {
    name: 'Classic Blue',
    cssVar: 'card-back-classic-blue',
  },
  'classic-red': {
    name: 'Classic Red',
    cssVar: 'card-back-classic-red',
  },
  'royal-purple': {
    name: 'Royal Purple',
    cssVar: 'card-back-royal-purple',
  },
  'forest-green': {
    name: 'Forest Green',
    cssVar: 'card-back-forest-green',
  },
  'midnight': {
    name: 'Midnight',
    cssVar: 'card-back-midnight',
  },
};
