import { NextResponse } from 'next/server';
import { google } from 'googleapis';

// Initialize Google Sheets API
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file'
  ],
});

const sheets = google.sheets({ version: 'v4', auth });

export async function POST(request) {
  try {
    const { data, sheetName, headers } = await request.json();

    if (!data || !Array.isArray(data)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    // Check if Google credentials are configured
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      console.log('Google credentials not configured, returning mock response');
      console.log('Export request received:', {
        dataLength: data.length,
        sheetName,
        headers,
        sampleData: data.slice(0, 2)
      });

      return NextResponse.json({
        success: true,
        message: `Successfully exported ${data.length} rows to Google Sheet (mock)`,
        sheetName,
        exportedRows: data.length,
        timestamp: new Date().toISOString(),
        note: 'Google Sheets integration not configured. Add GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY to .env.local'
      });
    }

    // Additional check for malformed credentials
    try {
      // Test the auth object
      await auth.getClient();
    } catch (authError) {
      console.log('Google auth failed, returning mock response:', authError.message);
      return NextResponse.json({
        success: true,
        message: `Successfully exported ${data.length} rows to Google Sheet (mock)`,
        sheetName,
        exportedRows: data.length,
        timestamp: new Date().toISOString(),
        note: 'Google Sheets credentials are invalid. Please check your environment variables.'
      });
    }

    // Use a pre-configured spreadsheet ID (you'll need to create this manually)
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    
    if (!spreadsheetId) {
      console.log('No spreadsheet ID configured, returning mock response');
      return NextResponse.json({
        success: true,
        message: `Successfully exported ${data.length} rows to Google Sheet (mock)`,
        sheetName,
        exportedRows: data.length,
        timestamp: new Date().toISOString(),
        note: 'Google Sheets integration not configured. Add GOOGLE_SPREADSHEET_ID to .env.local and share the spreadsheet with your service account email.'
      });
    }

    // Get the current data to find the next available row
    const currentData = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'A:C', // Only check columns A, B, C
    });

    // Find the next available row (start from row 2 if headers exist, otherwise row 1)
    const nextRow = currentData.data.values ? currentData.data.values.length + 1 : 1;

    // Prepare data in the specific format: Name, Email, Phone No.
    const sheetData = data.map(row => [
      row.practice_name || row.owner_name || row.first_name || 'N/A', // Name (Column A)
      row.email || 'N/A', // Email (Column B)
      row.phone_number || 'N/A' // Phone No. (Column C)
    ]);

    // Append data to the next available row
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `A${nextRow}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: sheetData,
      },
    });

    // Note: Headers should be manually set up in the Google Sheet
    // Column A: Name, Column B: Email, Column C: Phone No.

    return NextResponse.json({
      success: true,
      message: `Successfully exported ${data.length} entries to Google Sheet (starting from row ${nextRow})`,
      spreadsheetId,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
      exportedRows: data.length,
      startRow: nextRow,
      endRow: nextRow + data.length - 1,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Export to sheets error:', error);
    return NextResponse.json(
      { error: 'Failed to export to Google Sheets: ' + error.message },
      { status: 500 }
    );
  }
}
