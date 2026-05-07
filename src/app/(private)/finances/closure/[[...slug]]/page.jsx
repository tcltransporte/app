import CashClosureView from '@/app/views/finances/closure';
import * as financeAction from '@/app/actions/finance.action';
import { ServiceStatus } from '@/libs/service';

export const metadata = {
  title: 'Fechamento',
}

export default async function FinanceClosurePage() {
  try {
    const now = new Date();
    const initialDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const result = await financeAction.findCashClosuresByDate({
      date: initialDate
    });

    if (result?.header?.status !== ServiceStatus.SUCCESS) {
      throw result;
    }

    const initialTable = {
      items: result.body.rows || [],
      total: result.body.count || 0,
      sortBy: 'bankAccountId',
      sortOrder: 'ASC'
    };

    return (
      <CashClosureView
        initialTable={initialTable}
        initialDate={initialDate}
      />
    );
  } catch (error) {
    return error?.body?.message || error.message
  }
}
