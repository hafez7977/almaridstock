import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.c3feb9cc1fe04d038d7113be0d8bcf85',
  appName: 'almaridstock',
  webDir: 'dist',
  server: {
    url: "https://c3feb9cc-1fe0-4d03-8d71-13be0d8bcf85.lovableproject.com?forceHideBadge=true",
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: "#ff7f00",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#ffffff",
      splashFullScreen: true,
      splashImmersive: true,
      layoutName: "launch_screen",
      useDialog: true,
    },
    App: {
      launchAutoHide: false
    },
    Browser: {
      presentationStyle: "popover"
    }
  },
  ios: {
    icon: "/lovable-uploads/1e2dfa0f-19d5-4b17-a983-a81789205f51.png"
  },
  android: {
    icon: "/lovable-uploads/1e2dfa0f-19d5-4b17-a983-a81789205f51.png"
  }
};

export default config;