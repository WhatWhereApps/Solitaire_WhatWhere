import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.solitaire.master',
  appName: 'Solitaire',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 2500,
      launchAutoHide: true,
      backgroundColor: '#064e3b', // emerald-900
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#064e3b',
    },
  },
  ios: {
    contentInset: 'automatic',
  },
  android: {
    backgroundColor: '#064e3b',
  },
};

export default config;