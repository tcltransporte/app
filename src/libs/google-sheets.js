import { google } from 'googleapis';

/**
 * Get authenticated Google OAuth2 client for a specific user
 * @param {object} tokens - { accessToken, refreshToken, expiryDate }
 */
export function getOAuth2Client(tokens = null) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback'
  );

  if (tokens) {
    oauth2Client.setCredentials({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      expiry_date: tokens.expiryDate,
    });
  }

  return oauth2Client;
}

/**
 * Generate authorization URL
 */
export function getAuthUrl() {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file',
    ],
    prompt: 'consent', // Force consent to get refresh token
  });
}

/**
 * Create a new spreadsheet with data using user's OAuth2 client
 * @param {object} oauth2Client - Authenticated OAuth2 client
 * @param {string} title 
 * @param {Array<Array<any>>} rows - 2D array of data
 * @returns {string} - Spreadsheet URL
 */
export async function createSpreadsheet(oauth2Client, title, rows) {
  const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

  // 1. Create Spreadsheet with an explicit sheet name to avoid locale issues (Sheet1 vs Página1)
  const resource = {
    properties: {
      title,
    },
    sheets: [
      {
        properties: {
          title: 'Export',
        },
      },
    ],
  };

  const spreadsheet = await sheets.spreadsheets.create({
    resource,
    fields: 'spreadsheetId,spreadsheetUrl',
  });

  const spreadsheetId = spreadsheet.data.spreadsheetId;

  // 2. Add Data using the explicit sheet name
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'Export!A1',
    valueInputOption: 'RAW',
    resource: {
      values: rows,
    },
  });

  return spreadsheet.data.spreadsheetUrl;
}
