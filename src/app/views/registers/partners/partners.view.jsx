'use client';

import React, { useState, useCallback } from 'react';
import {
  FilterList as FilterIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

import { PartnerDetail } from './partners.detail';
import { useTable } from '@/hooks/useTable';
import { useViewNavigation } from '@/hooks/useViewNavigation';
import { Container, Table, Toolbar } from '@/components/common';
import * as partnerService from '@/app/services/partner.service';
import { ServiceStatus } from '@/libs/service';

export function ViewPartners({ partnerId, initialData }) {

  const navigation = useViewNavigation('/registers/partners', partnerId);
  const table = useTable({
    initialData,
    rowKey: 'codigo_pessoa'
  });

  const handleRowDoubleClick = (row) => navigation.setSelectedId(row.codigo_pessoa);
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
        search: table.search 
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
  }, [table.page, table.rowsPerPage, table.search]);

  // Reload when page or rowsPerPage changes
  React.useEffect(() => {
    const isFirstPageWithInitialData = table.page === 1 && table.rowsPerPage === 50 && initialData;
    if (!isFirstPageWithInitialData) {
      loadData();
    }
  }, [table.page, table.rowsPerPage]);

  const handleDelete = async () => {
    if (!table.selecteds.length) return;
    table.setLoading(true);
    try {
      for (const id of table.selecteds) {
        await partnerService.destroy(id);
      }
      await loadData();
    } catch (error) {
      console.error('Erro ao excluir:', error);
    } finally {
      table.setLoading(false);
    }
  };


  const columns = [
    { field: 'codigo_pessoa', headerName: 'Código', width: 90 },
    { field: 'cpfCnpj', headerName: 'CPF/CNPJ', width: 150 },
    { field: 'surname', headerName: 'Nome', fontWeight: 500 },
    { field: 'name', headerName: 'Razão Social' },
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
    { label: 'Filtros', icon: <FilterIcon />, color: 'inherit', variant: 'text', onClick: () => { } },
    { label: 'Pesquisar', icon: <SearchIcon />, color: 'primary', variant: 'outlined', onClick: () => loadData() },
  ]

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
          rowKey="codigo_pessoa"
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
