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
    if (typeResp.header.status === ServiceStatus.SUCCESS && typeResp.body.items.length > 0) {
      solicitationType = typeResp.body.items[0];
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
    sortBy: 'id',
    sortOrder: 'DESC'
  });

  const isSuccess = solicitationsResp.header.status === ServiceStatus.SUCCESS;
  const initialTable = isSuccess ? solicitationsResp.body : { items: [], total: 0 };
  const resolvedFilters = isSuccess ? solicitationsResp.body.filters : initialFilters;
  const resolvedRange = isSuccess ? solicitationsResp.body.range : initialRange;

  return (
    <SolicitationView
      initialTable={initialTable}
      initialFilters={resolvedFilters}
      initialRange={resolvedRange}
      dateFieldOptions={dateFieldOptions}
      solicitationType={solicitationType}
      selectedId={selectedId}
    />
  );
}
