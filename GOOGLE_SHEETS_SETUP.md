# Google Sheets Integration Setup

## Prerequisites

1. **Google Cloud Console Account**: You need access to Google Cloud Console
2. **Google Sheets Document**: Create a Google Sheets document with the required structure

## Step 1: Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Google Sheets API
   - Google Drive API

## Step 2: OAuth 2.0 Configuration

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Choose "Web application"
4. Add authorized JavaScript origins:
   - `http://localhost:5173` (for development)
   - Your production domain
5. Add authorized redirect URIs:
   - `http://localhost:5173` (for development)
   - Your production domain
6. Copy the Client ID

## Step 3: Update the Application

1. Open `src/services/googleAuth.ts`
2. Replace the empty `GOOGLE_CLIENT_ID` with your actual client ID:
   ```typescript
   const GOOGLE_CLIENT_ID = 'your-google-client-id-here';
   ```

## Step 4: Google Sheets Structure

Create a Google Sheets document with the following tabs and structure:

### Stock Tab
Columns (A-W):
- SN, Status, Name, Bar Code, Model, Spec Code, Description, Colour Ext, Colour Int, Chassis No, Engine No, Supplier, Branch, Place, Customer Details, SP, SD, Inv No, AMPI, Paper, Deal, Received Date, Aging

### Incoming Tab
Same structure as Stock tab

### KSA Tab
Same structure as Stock tab

### Logs Tab (auto-created)
Columns (A-E):
- Timestamp, SN, Old Status, New Status, Changed By

## Step 5: Get Your Spreadsheet ID

1. Open your Google Sheets document
2. Copy the ID from the URL: `https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit`
3. Enter this ID in the application when prompted

## Step 6: Test the Integration

1. Start the application
2. Sign in with your Google account
3. Enter your Spreadsheet ID
4. The application should load your car data from Google Sheets

## Features

- **Real-time sync**: Data is automatically synced with Google Sheets
- **Status logging**: All status changes are logged to the Logs tab
- **Filtering**: Filter cars by status, model, branch, and color
- **Alerts**: Get alerts for cars that need follow-up (Booked > 3 days)
- **Export**: Export data to PDF or Excel (coming soon)

## Troubleshooting

### Common Issues

1. **"Google Client ID is not configured"**
   - Make sure you've updated the `GOOGLE_CLIENT_ID` in `googleAuth.ts`

2. **"Failed to load Google API"**
   - Check your internet connection
   - Ensure the Google APIs are enabled in Google Cloud Console

3. **"Google Sheets API error"**
   - Verify your spreadsheet ID is correct
   - Make sure your Google account has access to the spreadsheet
   - Check that the sheet tabs exist (Stock, Incoming, KSA)

4. **Authentication issues**
   - Clear your browser cache and cookies
   - Make sure your domain is added to authorized origins
   - Check that the OAuth consent screen is configured

### Need Help?

If you encounter issues:
1. Check the browser console for detailed error messages
2. Verify your Google Cloud Console configuration
3. Ensure your Google Sheets document has the correct structure