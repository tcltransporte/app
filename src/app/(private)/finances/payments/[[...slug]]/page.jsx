import PayableView from '@/app/views/finances/payments';
import * as financeEntryAction from '@/app/actions/financeEntry.action';
import { ServiceStatus } from '@/libs/service';
import { format } from 'date-fns';
import { getSession } from '@/libs/session';

export const metadata = {
  title: 'Contas a Pagar',
}

export default async function FinancePayablePage({ params }) {
  try {
    const { slug } = await params;
    const selectedId = Array.isArray(slug) && slug.length > 0 ? slug[0] : undefined;
    const session = await getSession();
    const currentCompany = session?.company
      ? { id: session.company.id, surname: session.company.surname, name: session.company.name }
      : null;

    const operationType = 2
    const initialFilters = {
      company: currentCompany
    }

    const today = format(new Date(), 'yyyy-MM-dd');
    const initialRange = { start: today, end: today, field: 'dueDate' };

    const result = await financeEntryAction.findAll({
      page: 1,
      limit: 50,
      operationType,
      range: initialRange,
      filters: initialFilters
    });

    if (result?.header?.status !== ServiceStatus.SUCCESS) {
      throw result;
    }

    const initialTable = { items: result.body.rows || [], total: result.body.count || 0 };

    return <PayableView operationType={operationType} initialTable={initialTable} selectedId={selectedId} initialRange={initialRange} initialFilters={initialFilters} />;

  } catch (error) {
    return error?.body?.message || error.message
  }

}
