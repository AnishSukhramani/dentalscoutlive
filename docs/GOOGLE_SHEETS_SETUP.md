# Google Sheets Integration Setup Guide

This guide will help you set up Google Sheets integration for the Agentic Call export functionality.

## ✅ What's Already Implemented

- **Export Functionality**: The Agentic Call component can now export selected practices to Google Sheets
- **API Endpoint**: `/api/export-to-sheets` is ready to create and populate Google Sheets
- **UI Integration**: Export button is connected and shows success/error notifications
- **Mock Mode**: Works without credentials (shows mock success message)

## 🔧 Setup Steps

### Step 1: Create Google Cloud Project

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create a new project** or select existing one
3. **Note your Project ID** (you'll need this later)

### Step 2: Enable Google Sheets API

1. **Go to "APIs & Services" > "Library"**
2. **Search for "Google Sheets API"**
3. **Click "Enable"**

**Note**: You don't need Google Drive API for this approach.

### Step 3: Create Service Account

1. **Go to "APIs & Services" > "Credentials"**
2. **Click "Create Credentials" > "Service Account"**
3. **Fill in details**:
   - Name: `dental-scout-sheets`
   - Description: `Service account for Google Sheets export`
4. **Click "Create and Continue"**
5. **Skip role assignment** (click "Continue")
6. **Click "Done"**

### Step 4: Generate JSON Key

1. **Click on your service account** in the credentials list
2. **Go to "Keys" tab**
3. **Click "Add Key" > "Create new key"**
4. **Select "JSON" format**
5. **Download the JSON file**

### Step 5: Extract Credentials

Open the downloaded JSON file and copy these values:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "your-service-account@project.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

### Step 6: Create and Configure Spreadsheet

1. **Create a new Google Sheet** manually in your Google Drive
2. **Copy the Spreadsheet ID** from the URL:
   - URL format: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
   - Copy the `SPREADSHEET_ID` part
3. **Share the spreadsheet** with your service account email:
   - Click "Share" in the top right
   - Add your service account email: `your-service-account@project.iam.gserviceaccount.com`
   - Give it "Editor" permissions
   - Click "Send"

### Step 7: Set Environment Variables

Add these to your `.env.local` file:

```bash
# Google Sheets Service Account
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_PROJECT_ID=your-project-id
GOOGLE_SPREADSHEET_ID=your-spreadsheet-id-here
```

**Important**: 
- Keep the quotes around the private key
- The `\n` characters will be automatically converted to newlines
- Never commit this file to version control

### Step 8: Test the Integration

1. **Restart your development server**
2. **Go to Agentic Call component**
3. **Select some practices**
4. **Click "Export to Google Sheet"**
5. **Check the console** for the export URL
6. **Verify the data** appears in the new Google Sheet

## 🔒 Security Best Practices

1. **Environment Variables**: Never hardcode credentials in your code
2. **Service Account**: Use service accounts instead of user accounts for server-side operations
3. **Scopes**: Only request necessary permissions (spreadsheets scope)
4. **Key Rotation**: Regularly rotate your service account keys
5. **Access Control**: Limit who can access your service account credentials

## 🚀 Production Deployment

### Vercel
Add the environment variables in your Vercel project settings:
1. Go to your project dashboard
2. Navigate to "Settings" > "Environment Variables"
3. Add each variable with the same names as in `.env.local`

### Other Platforms
Add the environment variables according to your hosting platform's documentation.

## 🐛 Troubleshooting

### Common Issues

1. **"Invalid credentials" error**
   - Check that your service account email and private key are correct
   - Ensure the private key includes the full key with `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`

2. **"Permission denied" error**
   - Make sure Google Sheets API is enabled
   - Verify your service account has the necessary permissions

3. **"Project not found" error**
   - Check that your project ID is correct
   - Ensure the service account belongs to the correct project

### Debug Mode

The API will return a mock response if credentials are not configured, with a note explaining what's missing.

## 📊 What Gets Exported

The export includes these columns:
- **ID**: Practice ID from database
- **Practice Name**: Name of the dental practice
- **Owner Name**: Practice owner's name
- **Contact Name**: Primary contact person
- **Phone**: Phone number
- **Email**: Email address
- **Tags**: Comma-separated list of tags
- **Export Date**: Timestamp of when the export was created

## 🎨 Sheet Formatting

The exported sheet includes:
- **Formatted headers** with blue background and white bold text
- **Clean data layout** with proper column alignment
- **Timestamp** for tracking when exports were created

## 🔄 Future Enhancements

Potential improvements:
- **Template sheets**: Export to predefined templates
- **Scheduled exports**: Automatic exports at regular intervals
- **Multiple sheets**: Export different data to different sheets
- **Sharing**: Automatically share sheets with specific users
- **Webhooks**: Notify when exports are complete

## 📞 Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify your environment variables are set correctly
3. Test with a simple export first
4. Check Google Cloud Console for API usage and errors
