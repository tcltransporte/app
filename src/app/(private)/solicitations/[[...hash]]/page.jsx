import SolicitationView from '@/app/views/solicitations';
import * as solicitationService from '@/app/services/solicitation.service';
import { findAll as findTypeAll } from '@/app/services/solicitationType.service';
import { ServiceStatus } from '@/libs/service';
import { getSession } from '@/libs/session';
import { redirect } from 'next/navigation';
import { format } from 'date-fns';

export default async function SolicitationPage({ params }) {
  const { hash } = await params;
  const typeHash = Array.isArray(hash) ? hash[0] : hash;
  const selectedId = Array.isArray(hash) && hash.length > 1 ? hash[1] : undefined;

  const session = await getSession();
  if (!session) redirect('/sign-in');

  let solicitationType = null;
  if (typeHash) {
    const typeResp = await findTypeAll({ filters: { hash: typeHash } });
    if (typeResp.status === ServiceStatus.SUCCESS && typeResp.items.length > 0) {
      solicitationType = typeResp.items[0];
    }
  }

  const dateFieldOptions = [
    { label: 'Data da Solicitação', value: 'date' },
    { label: 'Data de Previsão', value: 'forecastDate' },
  ];

  const today = format(new Date(), 'yyyy-MM-dd');
  const initialFilters = { typeHash };
  const initialRange = { start: today, end: today, field: 'date' };

  const solicitationsResp = await solicitationService.findAll({
    page: 1,
    limit: 50,
    filters: initialFilters,
    range: initialRange,
    sortBy: 'date',
    sortOrder: 'DESC'
  });

  const initialTable = solicitationsResp.status === ServiceStatus.SUCCESS
    ? { items: solicitationsResp.items || [], total: solicitationsResp.total || 0 }
    : { items: [], total: 0 };

  return (
    <SolicitationView
      initialTable={initialTable}
      initialFilters={initialFilters}
      initialRange={initialRange}
      dateFieldOptions={dateFieldOptions}
      solicitationType={solicitationType}
      selectedId={selectedId}
    />
  );
}
