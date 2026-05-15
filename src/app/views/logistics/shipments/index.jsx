'use client';

import React from 'react';
import ShipmentList from './shipment-list';

export default function ShipmentView({ initialTable, selectedId, initialFilters, initialRange, companyId }) {
  return (
    <ShipmentList
      title="Romaneios"
      initialTable={initialTable}
      selectedId={selectedId}
      initialFilters={initialFilters}
      initialRange={initialRange}
      companyId={companyId}
    />
  );
}
