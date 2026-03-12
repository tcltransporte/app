import { RegistersPartners } from "@/app/views/registers/partners"
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

  const initialTable = result.status === 200
    ? { items: result.items || [], total: result.total || 0 }
    : { items: [], total: 0 }

  return (
    <RegistersPartners
      partnerId={id?.[0]}
      initialTable={initialTable}
      initialFilters={initialFilters}
      initialRange={initialRange}
      dateFieldOptions={dateFieldOptions}
    />
  )
}
