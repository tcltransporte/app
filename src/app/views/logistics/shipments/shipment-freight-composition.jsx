'use client';

import React from 'react';
import { Box, Grid, Typography } from '@mui/material';
import { NumericField } from '@/components/controls';
import { SectionTable } from '@/components/common';
import { ShipmentFreightLetterDrawer } from './shipment-freight-letter-drawer';

function formatMoney(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

let tempKey = 0;
function nextRowKey() {
  tempKey += 1;
  return `new-${tempKey}`;
}

function formatRowFromDrawer(data, componentTypes) {
  const type = componentTypes.find(
    (t) => Number(t.id) === Number(data.freightLetterComponentTypeId)
  );
  const rowKey = data.rowKey || nextRowKey();
  return {
    ...data,
    rowKey,
    id: data.id || rowKey,
    componentDescription: type?.description || '',
    payeeId: data.payee?.id ?? data.payeeId ?? null
  };
}

function buildColumns(componentTypes) {
  return [
    {
      field: 'componentDescription',
      headerName: 'Componente',
      renderCell: (_, item) =>
        item.componentDescription
        || componentTypes.find((t) => Number(t.id) === Number(item.freightLetterComponentTypeId))?.description
        || '—'
    },
    {
      field: 'value',
      headerName: 'Valor (R$)',
      renderCell: (val) => formatMoney(val)
    },
    {
      field: 'discountValue',
      headerName: 'Desc. (R$)',
      renderCell: (val) => formatMoney(val)
    },
    {
      field: 'operatorProtocol',
      headerName: 'Protocolo',
      renderCell: (val) => val || '—'
    }
  ];
}

export function ShipmentFreightComposition({
  components = [],
  componentTypes = [],
  freightValue,
  freightLetterValue,
  onChangeComponents,
  onFreightLetterValueChange
}) {
  const [drawer, setDrawer] = React.useState({ open: false, data: null, index: -1 });

  const columns = React.useMemo(() => buildColumns(componentTypes), [componentTypes]);

  const tableItems = React.useMemo(
    () => components.map((row) => ({
      ...row,
      id: row.id || row.rowKey
    })),
    [components]
  );

  const sumComponents = React.useMemo(
    () => components.reduce((sum, row) => sum + (Number(row.value) || 0), 0),
    [components]
  );

  const handleAdd = () => {
    setDrawer({
      open: true,
      data: {
        value: 0,
        discountValue: 0,
        effectiveDate: new Date().toISOString().split('T')[0]
      },
      index: -1
    });
  };

  const handleEdit = (item, index) => {
    setDrawer({ open: true, data: item, index });
  };

  const handleDelete = (item) => {
    onChangeComponents?.(components.filter((c) => c.rowKey !== item.rowKey));
  };

  const handleCloseDrawer = () => {
    setDrawer({ open: false, data: null, index: -1 });
  };

  const handleSaveDrawer = (data) => {
    const formatted = formatRowFromDrawer(data, componentTypes);

    if (drawer.index >= 0) {
      onChangeComponents?.(
        components.map((c, i) => (i === drawer.index ? { ...c, ...formatted } : c))
      );
    } else {
      onChangeComponents?.([...components, formatted]);
    }
  };

  return (
    <>
      <SectionTable
        title="Composição do valor de frete"
        columns={columns}
        items={tableItems}
        emptyMessage="Não há itens na tabela."
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <Grid container spacing={2} sx={{ mt: 1.5 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              Valor frete
            </Typography>
            <Typography variant="body2" fontWeight={700} color="primary.main">
              R$ {formatMoney(freightValue ?? sumComponents)}
            </Typography>
          </Box>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <NumericField
            label="Valor carta frete"
            value={freightLetterValue ?? ''}
            onChange={onFreightLetterValueChange}
            fullWidth
            size="small"
          />
        </Grid>
      </Grid>

      <ShipmentFreightLetterDrawer
        open={drawer.open}
        freightLetter={drawer.data}
        componentTypes={componentTypes}
        onClose={handleCloseDrawer}
        onSave={handleSaveDrawer}
      />
    </>
  );
}
