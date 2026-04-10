import BanksView from '@/app/views/finances/banks';
import * as financeAction from '@/app/actions/finance.action';
import { ServiceStatus } from '@/libs/service';
import { format } from 'date-fns';

export const metadata = {
  title: 'Movimento Bancário',
}

export default async function FinanceBanksPage({ params }) {
  try {
    const { slug } = await params;
    const selectedId = Array.isArray(slug) && slug.length > 0 ? slug[0] : undefined;

    const today = format(new Date(), 'yyyy-MM-dd');
    const initialRange = { start: today, end: today, field: 'realDate' };

    const result = await financeAction.findAllBankMovements({
      page: 1,
      limit: 50,
      range: initialRange
    });

    if (result?.header?.status !== ServiceStatus.SUCCESS) {
      throw result;
    }

    const initialTable = { 
      items: result.body.rows || [], 
      total: result.body.count || 0 
    };

    return (
      <BanksView 
        initialTable={initialTable} 
        selectedId={selectedId} 
        initialRange={initialRange} 
      />
    );

  } catch (error) {
    return error?.body?.message || error.message
  }
}
