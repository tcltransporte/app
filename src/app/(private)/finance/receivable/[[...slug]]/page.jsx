import FinanceEntriesList from '@/app/views/finance/finance-entries-list';
import * as financeEntryAction from '@/app/actions/financeEntry.action';
import { ServiceStatus } from '@/libs/service';

export const metadata = {
  title: 'Contas a Receber',
}

export default async function FinanceReceivablePage({ params }) {
  const { slug } = await params;
  const selectedId = Array.isArray(slug) && slug.length > 0 ? slug[0] : undefined;
  
  const result = await financeEntryAction.findAll({
    page: 1,
    limit: 50,
    operationType: 1
  });

  const initialTable = result?.header?.status === ServiceStatus.SUCCESS
    ? { items: result.body.rows || [], total: result.body.count || 0 }
    : { items: [], total: 0 };

  return <FinanceEntriesList operationType={1} title="Contas a Receber" initialTable={initialTable} selectedId={selectedId} />
}
