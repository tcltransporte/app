import { AppContext } from './src/database/index.js';
import * as financeRepository from './src/app/repositories/finance.repository.js';

async function test() {
  const db = new AppContext();
  try {
    const accounts = await financeRepository.findBankBalances(null, 1); // Testando para empresa ID 1
    console.log('CONTAS ENCONTRADAS:', JSON.stringify(accounts, null, 2));
  } catch (err) {
    console.error('ERRO NO TESTE:', err);
  } finally {
    process.exit();
  }
}

test();
