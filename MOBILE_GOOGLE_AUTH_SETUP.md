# Mobile Google Authentication Setup

## Prerequisites

1. **Google Cloud Console project** with OAuth 2.0 credentials
2. **Existing Google Sheets API setup** (already done)
3. **Physical device or emulator** for testing

## Step 1: Google Cloud Console Configuration

### For Android:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services > Credentials**
3. Click **Create Credentials > OAuth client ID**
4. Select **Android** as application type
5. For **Package name**, use: `app.lovable.c3feb9cc1fe04d038d7113be0d8bcf85`
6. For **SHA-1 certificate fingerprint**:
   - **Debug**: Run `keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android`
   - Copy the SHA-1 fingerprint and paste it
7. Click **Create**

### For iOS:
1. In the same Google Cloud Console project
2. Create another **OAuth client ID**
3. Select **iOS** as application type
4. For **Bundle ID**, use: `app.lovable.c3feb9cc1fe04d038d7113be0d8bcf85`
5. Click **Create**

## Step 2: Download Configuration Files

### Android:
1. Download the `google-services.json` file from your Android OAuth client
2. Place it in the `android/app/` directory of your project

### iOS:
1. Download the `GoogleService-Info.plist` file from your iOS OAuth client
2. Place it in the `ios/App/App/` directory of your project

## Step 3: Native Platform Setup

### Build the Project:
```bash
# Clone and setup the project
git clone https://github.com/hafez7977/almaridstock.git
cd almaridstock
npm install

# Build the web assets
npm run build

# Add native platforms
npx cap add android
npx cap add ios

# Sync the project
npx cap sync
```

### Android Additional Setup:
1. Open `android/app/build.gradle`
2. Add at the bottom:
```gradle
apply plugin: 'com.google.gms.google-services'
```

3. Open `android/build.gradle`
4. Add to dependencies:
```gradle
classpath 'com.google.gms:google-services:4.3.15'
```

### iOS Additional Setup:
1. Open the project in Xcode: `npx cap open ios`
2. Right-click on the App folder in Xcode
3. Select "Add Files to App"
4. Add the `GoogleService-Info.plist` file
5. Make sure it's added to the App target

## Step 4: Run on Device

### Android:
```bash
npx cap run android
```

### iOS:
```bash
npx cap run ios
```

## Step 5: Test Authentication

1. Open the app on your device
2. Click "Sign in with Google"
3. You should see the native Google sign-in screen
4. After signing in, you should be able to access Google Sheets

## Troubleshooting

### Common Issues:

1. **"Sign in failed"** - Check that SHA-1 fingerprint is correct for Android
2. **"OAuth client not found"** - Ensure bundle ID matches exactly
3. **"Google Services not configured"** - Verify configuration files are in correct locations

### Debug Commands:
```bash
# Check Android debug keystore SHA-1
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

# Rebuild and sync after changes
npm run build && npx cap sync

# View logs
npx cap run android --livereload
npx cap run ios --livereload
```

## Files You Need to Add:

### Android:
- `android/app/google-services.json` (from Google Cloud Console)

### iOS:
- `ios/App/App/GoogleService-Info.plist` (from Google Cloud Console)

## Important Notes:

1. **Package/Bundle ID**: `app.lovable.c3feb9cc1fe04d038d7113be0d8bcf85` (already configured)
2. **Client ID**: `1035920558332-dv9nk30ftjn4gfhvtdr6i3ld8j96cm0h.apps.googleusercontent.com` (already configured)
3. The configuration files are specific to your Google Cloud project
4. SHA-1 fingerprints must match your signing certificate
5. Test on both debug and release builds if planning to publish

Once you complete these steps, Google authentication will work natively on both Android and iOS devices!