import FinanceEntriesList from '@/app/views/finance/finance-entries-list';
import * as financeEntryAction from '@/app/actions/financeEntry.action';
import { ServiceStatus } from '@/libs/service';

export const metadata = {
  title: 'Contas a Receber',
}

export default async function FinanceReceivablePage() {
  const result = await financeEntryAction.findAll({
    page: 1,
    limit: 50,
    include: [
      {
        association: 'title',
        where: { operationType: 2 },
        include: ['partner']
      }
    ]
  });

  const initialTable = result?.header?.status === ServiceStatus.SUCCESS ? result.body : { items: [], total: 0 };

  return <FinanceEntriesList operationType={2} title="Contas a Receber" initialTable={initialTable} />
}
