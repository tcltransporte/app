import PayableView from '@/app/views/finances/payable';
import * as financeEntryAction from '@/app/actions/financeEntry.action';
import { ServiceStatus } from '@/libs/service';
import { format } from 'date-fns';

export const metadata = {
  title: 'Contas a Pagar',
}

export default async function FinancePayablePage({ params }) {
  try {
    const { slug } = await params;
    const selectedId = Array.isArray(slug) && slug.length > 0 ? slug[0] : undefined;

    const operationType = 2

    const today = format(new Date(), 'yyyy-MM-dd');
    const initialRange = { start: today, end: today, field: 'dueDate' };

    const result = await financeEntryAction.findAll({
      page: 1,
      limit: 50,
      operationType,
      range: initialRange
    });

    if (result?.header?.status !== ServiceStatus.SUCCESS) {
      throw result;
    }

    const initialTable = { items: result.body.rows || [], total: result.body.count || 0 };

    return <PayableView operationType={operationType} initialTable={initialTable} selectedId={selectedId} initialRange={initialRange} />;

  } catch (error) {
    return error?.body?.message || error.message
  }

}
