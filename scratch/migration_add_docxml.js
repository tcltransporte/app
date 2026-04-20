import { AppContext } from '../src/database/index.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

async function run() {
  const db = new AppContext();
  try {
    console.log('Verificando conexão...');
    await db.authenticate();
    console.log('Conectado. Executando ALTER TABLE...');

    // Adiciona a coluna DocXml com tipo XML
    await db.query("ALTER TABLE DFeLoteDist ADD DocXml XML");
    
    console.log('Coluna DocXml adicionada com sucesso!');
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('A coluna DocXml já existe.');
    } else {
      console.error('Erro ao executar migration:', error.message);
    }
  } finally {
    await db.close();
  }
}

run();
