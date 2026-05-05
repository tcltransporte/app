import BanksView from '@/app/views/finances/banks';
import * as financeAction from '@/app/actions/finance.action';
import * as bankAccountAction from '@/app/actions/bankAccount.action';
import { ServiceStatus } from '@/libs/service';

export const metadata = {
  title: 'Movimento Bancário',
}

export default async function FinanceBanksPage({ params }) {
  try {
    const { slug } = await params;
    const selectedId = Array.isArray(slug) && slug.length > 0 ? slug[0] : undefined;

    const initialRange = { start: '', end: '', field: 'realDate' };

    const [movementsResult, bankAccountsResult] = await Promise.all([
      financeAction.findAllBankMovements({
        page: 1,
        limit: 50,
        range: initialRange,
        sortBy: 'realDate',
        sortOrder: 'DESC'
      }),
      bankAccountAction.findAll()
    ])

    if (movementsResult?.header?.status !== ServiceStatus.SUCCESS) {
      throw movementsResult;
    }

    if (bankAccountsResult?.header?.status !== ServiceStatus.SUCCESS) {
      throw bankAccountsResult;
    }

    const initialTable = {
      items: movementsResult.body.rows || [],
      total: movementsResult.body.count || 0,
      sortBy: 'realDate',
      sortOrder: 'DESC'
    };

    const initialBankAccounts = bankAccountsResult.body || [];

    return (
      <BanksView
        initialTable={initialTable}
        initialBankAccounts={initialBankAccounts}
        selectedId={selectedId}
        initialRange={initialRange}
      />
    );

  } catch (error) {
    return error?.body?.message || error.message
  }
}
