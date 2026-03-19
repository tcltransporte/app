
import { AppContext } from './src/database/index.js';
import 'dotenv/config';
import fs from 'fs';

async function describeTable() {
  const db = new AppContext();
  try {
    const [results] = await db.query("SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'SolicitacaoServicoRealizado'");
    fs.writeFileSync('schema_service.json', JSON.stringify(results, null, 2));
    console.log('Schema saved to schema_service.json');
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

describeTable();
