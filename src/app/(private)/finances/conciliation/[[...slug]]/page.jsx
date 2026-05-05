import ConciliationView from '@/app/views/finances/conciliation';
import * as financeAction from '@/app/actions/finance.action';
import * as bankAccountAction from '@/app/actions/bankAccount.action';
import { ServiceStatus } from '@/libs/service';

export const metadata = {
  title: 'Conciliação',
}

export default async function FinanceConciliationPage({ params }) {
  try {
    const { slug } = await params;
    const selectedId = Array.isArray(slug) && slug.length > 0 ? slug[0] : undefined;

    const initialRange = { start: '', end: '', field: 'realDate' };
    const initialFilters = { status: 'not_conciled' };

    const [movementsResult, bankAccountsResult] = await Promise.all([
      financeAction.findAllBankMovements({
        page: 1,
        limit: 50,
        filters: initialFilters,
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
      <ConciliationView
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
