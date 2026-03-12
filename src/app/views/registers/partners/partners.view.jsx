'use client';

import React, { useState, useCallback } from 'react';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { Badge } from '@mui/material';

import { PartnerDetail } from './partners.detail';
import { PartnerFilter } from './partners.filter';
import { useTable } from '@/hooks/useTable';
import { useViewNavigation } from '@/hooks/useViewNavigation';
import { Container, Table, Toolbar } from '@/components/common';
import * as partnerService from '@/app/services/partner.service';
import { ServiceStatus } from '@/libs/service';

export function ViewPartners({ partnerId, initialData, initialFilters }) {

  const navigation = useViewNavigation('/registers/partners', partnerId);
  const table = useTable({
    initialData
  });

  const [filters, setFilters] = React.useState(initialFilters || {});
  const [filterOpen, setFilterOpen] = React.useState(false);

  const activeFilterCount = React.useMemo(() => {
    return Object.entries(filters).filter(([key, value]) => {
      if (typeof value === 'boolean') return value === true;
      return value !== '' && value !== undefined && value !== null;
    }).length;
  }, [filters]);

  const handleRowDoubleClick = (row) => navigation.setSelectedId(row.id);
  const handleCloseModal = () => navigation.setSelectedId(undefined);

  const handleSave = () => {
    loadData();
    handleCloseModal();
  };

  const loadData = React.useCallback(async () => {
    table.setLoading(true);
    try {
      const result = await partnerService.findAll({
        page: table.page,
        limit: table.rowsPerPage,
        search: table.search,
        filters
      });
      if (result.status === ServiceStatus.SUCCESS) {
        table.setItems(result.items || []);
        table.setTotal(result.total || 0);
        table.setSelecteds([]);
      }
    } catch (error) {
      console.error('Erro ao buscar parceiros:', error);
    } finally {
      table.setLoading(false);
    }
  }, [table.page, table.rowsPerPage, table.search, filters]);

  const firstRender = React.useRef(true);

  // Reload when page or rowsPerPage changes
  React.useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      if (initialData) return;
    }
    loadData();
  }, [table.page, table.rowsPerPage, table.search, filters, initialData, loadData]);

  const handleDelete = async () => {
    if (!table.selecteds.length) return;
    table.setLoading(true);
    try {
      for (const item of table.selecteds) {
        await partnerService.destroy(item.id);
      }
      await loadData();
    } catch (error) {
      console.error('Erro ao excluir:', error);
    } finally {
      table.setLoading(false);
    }
  };


  const columns = [
    { field: 'id', headerName: 'Código', width: 90 },
    { field: 'cpfCnpj', headerName: 'CPF/CNPJ', width: 150 },
    { field: 'surname', headerName: 'Nome', fontWeight: 500 },
    { field: 'name', headerName: 'Razão Social' },
    {
      field: 'birthDate', headerName: 'Data Nasc.', width: 110,
      renderCell: (value) => {
        if (!value) return '';
        const date = new Date(value);
        return isNaN(date.getTime()) ? '' : date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
      }
    },
    {
      field: 'isActive', headerName: 'Ativo', align: 'center', width: 80,
      renderCell: (value) => value ? 'Sim' : 'Não'
    },
  ]

  const primaryActions = [
    { label: 'Adicionar', icon: <AddIcon />, variant: 'contained', color: 'primary', onClick: () => navigation.setSelectedId(null) },
    ...(table.selecteds.length > 0 ? [
      { label: 'Excluir', icon: <DeleteIcon />, variant: 'outlined', color: 'error', onClick: handleDelete },
    ] : []),
  ]

  const secondaryActions = [
    {
      label: 'Filtros',
      icon: (
        <Badge badgeContent={activeFilterCount} color="primary" sx={{ '& .MuiBadge-badge': { fontSize: 10, height: 16, minWidth: 16, top: 2, right: 2 } }}>
          <FilterIcon fontSize="small" />
        </Badge>
      ),
      onClick: () => setFilterOpen(true)
    },
    { label: 'Pesquisar', icon: <SearchIcon />, color: 'primary', variant: 'outlined', onClick: () => loadData() },
  ];

  return (
    <Container>

      <Container.Title items={[{ label: 'Cadastros' }, { label: 'Clientes' }]} />

      <Container.Content>

        <Toolbar
          primary={primaryActions}
          secondary={secondaryActions}
        />

        <Table
          columns={columns}
          items={table.items}
          selecteds={table.selecteds}
          onSelect={table.onSelect}
          onSelectAll={table.onSelectAll}
          onRowDoubleClick={handleRowDoubleClick}
          loading={table.loading}
        />

        <PartnerDetail
          partnerId={navigation.selectedId}
          onClose={handleCloseModal}
          onSave={handleSave}
        />

        <PartnerFilter
          open={filterOpen}
          filters={filters}
          onClose={() => setFilterOpen(false)}
          onApply={(vals) => {
            setFilters(vals);
            table.setPage(1);
          }}
        />

      </Container.Content>

      <Container.Footer
        total={table.total}
        page={table.page}
        rowsPerPage={table.rowsPerPage}
        selectedCount={table.selecteds.length}
        onPageChange={table.handlePageChange}
        onRowsPerPageChange={table.handleRowsPerPageChange}
      />

    </Container>
  )
}
