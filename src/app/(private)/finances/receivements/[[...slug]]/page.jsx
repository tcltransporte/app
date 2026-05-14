import ReceivableView from '@/app/views/finances/receivements';
import * as financeEntryAction from '@/app/actions/financeEntry.action';
import { ServiceStatus } from '@/libs/service';
import { getSession } from '@/libs/session';

export const metadata = {
  title: 'Contas a Receber',
}

export default async function FinanceReceivablePage({ params }) {
  const { slug } = await params;
  const selectedId = Array.isArray(slug) && slug.length > 0 ? slug[0] : undefined;
  const session = await getSession();
  const currentCompany = session?.company
    ? { id: session.company.id, surname: session.company.surname, name: session.company.name }
    : null;

  const operationType = 1
  const initialFilters = {
    status: 'open',
    ...(currentCompany ? { company: currentCompany } : {})
  }
  const initialSort = { sortBy: 'dueDate', sortOrder: 'ASC' }

  const initialRange = { start: '', end: '', field: 'dueDate' };

  const result = await financeEntryAction.findAll({
    page: 1,
    limit: 50,
    operationType,
    range: initialRange,
    filters: initialFilters,
    ...initialSort
  });

  const initialTable = result?.header?.status === ServiceStatus.SUCCESS
    ? { items: result.body.rows || [], total: result.body.count || 0, ...initialSort }
    : { items: [], total: 0 };

  return <ReceivableView operationType={operationType} initialTable={initialTable} selectedId={selectedId} initialRange={initialRange} initialFilters={initialFilters} />;
}
