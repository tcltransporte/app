import React from 'react';
import DistributionView from '@/app/views/sefaz/distribution';
import * as dfeLoteDistService from '@/app/services/dfeLoteDist.service';

export const metadata = {
  title: 'Distribuição DF-e - TCL',
}

export default async function DistributionPage() {
  const today = new Date().toISOString().split('T')[0];
  const initialRange = {
    field: 'dhEmi',
    start: today,
    end: today
  };

  const initialData = await dfeLoteDistService.findAll(null, {
    page: 1,
    limit: 50,
    sortBy: 'id',
    sortOrder: 'DESC',
    range: initialRange
  })

  return (
    <DistributionView 
      initialTable={{
        items: initialData.items || [],
        total: initialData.total || 0,
        page: 1,
        rowsPerPage: 50,
        sortBy: 'id',
        sortOrder: 'DESC'
      }}
      initialFilters={{
        nsu: '',
        idSchema: '',
        isUnPack: ''
      }}
      initialRange={initialRange}
    />
  );
}
