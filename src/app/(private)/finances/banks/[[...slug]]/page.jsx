import BanksView from '@/app/views/finances/banks';
import * as financeAction from '@/app/actions/finance.action';
import * as bankAccountAction from '@/app/actions/bankAccount.action';
import { ServiceStatus } from '@/libs/service';
import { format } from 'date-fns';

export const metadata = {
  title: 'Movimento Bancário',
}

export default async function FinanceBanksPage({ params }) {
  try {
    const { slug } = await params;
    const selectedId = Array.isArray(slug) && slug.length > 0 ? slug[0] : undefined;

    const today = format(new Date(), 'yyyy-MM-dd');
    const initialRange = { start: today, end: today, field: 'realDate' };

    const [movementsResult, bankAccountsResult, balancesResult] = await Promise.all([
      financeAction.findAllBankMovements({
        page: 1,
        limit: 50,
        range: initialRange,
        sortBy: 'realDate',
        sortOrder: 'DESC'
      }),
      bankAccountAction.findAll(),
      financeAction.findBankBalances()
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

    const balancesById = new Map(
      (balancesResult?.header?.status === ServiceStatus.SUCCESS ? (balancesResult.body || []) : [])
        .map((b) => [b.id, b])
    )
    const initialBankAccounts = (bankAccountsResult.body || []).map((acc) => ({
      ...acc,
      currentBalance: balancesById.get(acc.id)?.currentBalance ?? null,
    }));

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
