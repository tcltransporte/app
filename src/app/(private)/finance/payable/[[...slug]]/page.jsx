import FinanceEntriesList from '@/app/views/finance/finance-entries-list';
import * as financeEntryAction from '@/app/actions/financeEntry.action';
import { ServiceStatus } from '@/libs/service';

export const metadata = {
  title: 'Contas a Pagar',
}

export default async function FinancePayablePage({ params }) {
  const { slug } = await params;
  const selectedId = Array.isArray(slug) && slug.length > 0 ? slug[0] : undefined;

  const result = await financeEntryAction.findAll({
    page: 1,
    limit: 50,
    operationType: 2
  });

  const initialTable = result?.header?.status === ServiceStatus.SUCCESS
    ? { items: result.body.rows || [], total: result.body.count || 0 }
    : { items: [], total: 0 };

  return <FinanceEntriesList operationType={2} title="Contas a Pagar" initialTable={initialTable} selectedId={selectedId} />
}
