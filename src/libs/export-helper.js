import { getSession } from "@/libs/session"
import { AppContext } from "@/database"
import { ServiceResponse, ServiceStatus } from "@/libs/service"
import * as googleSheets from "@/libs/google-sheets"
import * as XLSX from 'xlsx';

/**
 * Generates an Excel file (Base64) on the server
 * @param {object} options
 * @param {Array} options.items
 * @param {Array} options.columns
 * @param {string} options.sheetName
 */
export function handleExcelExport({ items = [], columns = [], sheetName = 'Sheet1' }) {
  try {
    console.log('--- EXCEL EXPORT DEBUG ---');
    console.log('Items count:', items.length);
    console.log('Columns received:', columns.map(c => c.field).join(', '));

    const exportColumns = columns.filter(col => col.field && col.headerName);
    console.log('Filtered export columns:', exportColumns.map(c => c.field).join(', '));

    console.log('Sample Item (first 3 keys):', items[0] ? Object.keys(items[0]).slice(0, 3).join(', ') : 'No items');
    console.log('Sample Column:', JSON.stringify(exportColumns[0]));

    const data = items.map(item => {
      const row = {};
      exportColumns.forEach(col => {
        let value = item[col.field];

        if (typeof value === 'boolean') {
          value = value ? 'Sim' : 'Não';
        } else if (col.field.toLowerCase().includes('date') && value) {
          try {
            value = new Date(value).toLocaleDateString('pt-BR');
          } catch (e) {
            // skip
          }
        }
        row[col.headerName] = value;
      });
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generate Base64
    const base64 = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
    
    return ServiceResponse.success({ base64 });
  } catch (error) {
    console.error('Error generating Excel on server:', error);
    return ServiceResponse.error({ message: 'Erro ao gerar Excel no servidor' });
  }
}

/**
 * Higher-order utility to handle Google Sheets export for any service
 * @param {object} options
 * @param {Array} options.items - The raw data to export
 * @param {Array} options.columns - Column metadata for mapping
 * @param {string} options.title - Spreadsheet title
 */
export async function handleGoogleSheetsExport({ 
  items = [], 
  columns = [], 
  title = 'Exportação' 
}) {
  try {
    console.log('--- GOOGLE SHEETS EXPORT DEBUG ---');
    console.log('Items count:', items.length);
    console.log('Columns received:', columns.map(c => c.field).join(', '));
    const session = await getSession();
    const db = new AppContext();
    
    // 1. Get user tokens from DB
    const user = await db.User.findByPk(session.user.id, {
      attributes: ['googleAccessToken', 'googleRefreshToken', 'googleTokenExpiry']
    });

    if (!user || !user.googleAccessToken || !user.googleRefreshToken) {
      return ServiceResponse.error({
        status: 401,
        code: 'GOOGLE_AUTH_REQUIRED',
        message: 'Autenticação com Google necessária'
      });
    }

    // 2. Setup OAuth2 Client
    const oauth2Client = googleSheets.getOAuth2Client({
      accessToken: user.googleAccessToken,
      refreshToken: user.googleRefreshToken,
      expiryDate: user.googleTokenExpiry
    });

    // 3. Transform data for Google Sheets
    const headers = columns.filter(c => c.field && c.headerName).map(c => c.headerName);
    const exportColumns = columns.filter(c => c.field && c.headerName);
    const rows = [headers];

    items.forEach(item => {
      const row = exportColumns.map(col => {
        let value = item[col.field];
        
        // Generic formatters
        if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
        if (col.field.toLowerCase().includes('date') && value) {
          try {
            return new Date(value).toLocaleDateString('pt-BR');
          } catch (e) {
            return value;
          }
        }
        return value;
      });
      rows.push(row);
    });

    // 5. Create Spreadsheet
    const url = await googleSheets.createSpreadsheet(oauth2Client, title, rows);
    
    return ServiceResponse.success({ url });
  } catch (error) {
    console.error('CRITICAL ERROR on generic export helper:', error);
    
    const errorDetails = {
      message: error.message || 'Erro inesperado na exportação',
      code: error.code || 'EXPORT_HELPER_ERROR',
      toString: error.toString ? error.toString() : 'Unknown error'
    };

    return ServiceResponse.error({ 
      status: 500,
      code: errorDetails.code,
      message: errorDetails.message,
      body: { details: errorDetails }
    });
  }
}
