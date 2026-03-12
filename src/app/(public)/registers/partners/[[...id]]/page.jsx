import { ViewPartners } from "@/app/views/registers/partners/partners.view"
import * as partnerService from "@/app/services/partner.service"
import { format } from 'date-fns';

export default async ({ params }) => {
  const { id } = await params;

  const dateFieldOptions = [
    { label: 'Data de Nascimento', value: 'birthDate' },
    { label: 'Data de Cadastro', value: 'createdAt' },
  ];

  const today = format(new Date(), 'yyyy-MM-dd');
  const initialFilters = {};
  const initialRange = { start: today, end: today, field: 'birthDate' };

  const result = await partnerService.findAll({
    page: 1,
    limit: 50,
    filters: initialFilters,
    range: initialRange
  })

  const initialData = result.status === 200
    ? { items: result.items || [], total: result.total || 0 }
    : { items: [], total: 0 }

  return (
    <ViewPartners
      partnerId={id?.[0]}
      initialData={initialData}
      initialFilters={initialFilters}
      initialRange={initialRange}
      dateFieldOptions={dateFieldOptions}
    />
  )
}
