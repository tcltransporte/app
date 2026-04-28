import React from 'react';
import DistributionView from '@/app/views/dfe/repository';
import * as dfeLoteDistAction from '@/app/actions/dfe-repository.action';
import { ServiceStatus } from '@/libs/service';

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

  const result = await dfeLoteDistAction.findAll({
    page: 1,
    limit: 50,
    sortBy: 'dhEmi',
    sortOrder: 'DESC',
    range: initialRange
  });

  const initialTable = result?.header?.status === ServiceStatus.SUCCESS
    ? result.body
    : { items: [], total: 0 };

  return (
    <DistributionView 
      initialTable={initialTable}
      initialFilters={{
        numeroDoc: '',
        chNFe: '',
        cnpj: '',
        xNome: '',
        vNF: '',
      }}
      initialRange={initialRange}
    />
  );
}
