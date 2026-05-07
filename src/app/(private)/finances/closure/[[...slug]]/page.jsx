import CashClosureView from '@/app/views/finances/closure';
import * as financeAction from '@/app/actions/finance.action';
import { ServiceStatus } from '@/libs/service';

export const metadata = {
  title: 'Fechamento',
}

export default async function FinanceClosurePage() {
  try {
    const initialDate = '';
    const result = await financeAction.findCashClosuresByDate({
      date: initialDate,
      page: 1,
      limit: 50,
      sortBy: 'date',
      sortOrder: 'DESC'
    });

    if (result?.header?.status !== ServiceStatus.SUCCESS) {
      throw result;
    }

    const initialTable = {
      items: result.body.rows || [],
      total: result.body.count || 0,
      page: 1,
      limit: 50,
      sortBy: 'date',
      sortOrder: 'DESC'
    };

    return (
      <CashClosureView
        initialTable={initialTable}
        initialDate={initialDate}
      />
    );
  } catch (error) {
    return error?.body?.message || error.message;
  }
}
