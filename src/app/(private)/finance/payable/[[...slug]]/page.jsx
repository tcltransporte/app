import PayableView from '@/app/views/finances/payable';
import * as financeEntryAction from '@/app/actions/financeEntry.action';
import { ServiceStatus } from '@/libs/service';

export const metadata = {
  title: 'Contas a Pagar',
}

export default async function FinancePayablePage({ params }) {
  const { slug } = await params;
  const selectedId = Array.isArray(slug) && slug.length > 0 ? slug[0] : undefined;

  const operationType = 2

  const result = await financeEntryAction.findAll({
    page: 1,
    limit: 50,
    operationType
  });

  const initialTable = result?.header?.status === ServiceStatus.SUCCESS
    ? { items: result.body.rows || [], total: result.body.count || 0 }
    : { items: [], total: 0 };

  return <PayableView operationType={operationType} initialTable={initialTable} selectedId={selectedId} />;
}
