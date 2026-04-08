import FinanceEntriesList from '@/app/views/finance/finance-entries-list';
import * as financeEntryAction from '@/app/actions/financeEntry.action';
import { ServiceStatus } from '@/libs/service';

export const metadata = {
  title: 'Contas a Pagar',
}

export default async function FinancePayablePage() {
  const result = await financeEntryAction.findAll({
    page: 1,
    limit: 50,
    include: [
      {
        association: 'title',
        where: { operationType: 1 },
        include: ['partner']
      }
    ]
  });

  const initialTable = result?.header?.status === ServiceStatus.SUCCESS ? result.body : { items: [], total: 0 };

  return <FinanceEntriesList operationType={1} title="Contas a Pagar" initialTable={initialTable} />
}
