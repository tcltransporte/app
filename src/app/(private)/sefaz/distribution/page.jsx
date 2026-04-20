import React from 'react';
import DistributionView from '@/app/views/sefaz/distribution';

export const metadata = {
  title: 'Distribuição DF-e - TCL',
}

export default function DistributionPage() {
  return (
    <DistributionView 
      initialTable={{
        items: [],
        total: 0,
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
      initialRange={{
        field: 'dhEmi',
        start: null,
        end: null
      }}
    />
  );
}
