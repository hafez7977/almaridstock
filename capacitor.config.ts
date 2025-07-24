import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.c3feb9cc1fe04d038d7113be0d8bcf85',
  appName: 'almaridstock',
  webDir: 'dist',
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
    GoogleAuth: {
      scopes: ['profile', 'email', 'https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive.readonly'],
      serverClientId: '1035920558332-dv9nk30ftjn4gfhvtdr6i3ld8j96cm0h.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
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