'use client';

import React from 'react';
import {
  FilterList as FilterIcon,
  Search as SearchIcon,
  CalendarMonth as CalendarIcon,
  Add as AddIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';

import { useRouter } from 'next/navigation';
import {
  Box,
  Divider,
  Button
} from '@mui/material';
import { PartnerDetail } from './partners.detail';
import { useTable } from '@/hooks/useTable';
import { Title } from '@/components/common/Title';
import { ViewContainer } from '@/components/common/ViewContainer';
import { Table } from '@/components/common/Table';
import { Toolbar } from '@/components/common/Toolbar';
import { Footer } from '@/components/common/Footer';

const mockClientes = [
  { id: 1, doc: '52692', beneficiario: 'Edson Dos Santos', categoria: '1.06 - Vendas Mercado Livre Full', tipo: '-', vencimento: '01/03/2026', agendamento: '-', valor: '39,95', conta: '-' },
  { id: 2, doc: '52693', beneficiario: 'Edson Dos Santos', categoria: '1.06 - Vendas Mercado Livre Full', tipo: '-', vencimento: '01/03/2026', agendamento: '-', valor: '84,00', conta: '-' },
  { id: 3, doc: '52694', beneficiario: 'Daniel Olivo Pereira', categoria: '1.01 - Venda no Mercado Livre', tipo: '-', vencimento: '01/03/2026', agendamento: '-', valor: '103,84', conta: '-' },
  { id: 4, doc: '52704', beneficiario: 'Eduardo Bertolloti Junior', categoria: '1.06 - Vendas Mercado Livre Full', tipo: '-', vencimento: '01/03/2026', agendamento: '-', valor: '39,95', conta: '-' },
  { id: 5, doc: '52706', beneficiario: 'Daniel Eggerst Zapazo', categoria: '1.06 - Vendas Mercado Livre Full', tipo: '-', vencimento: '01/03/2026', agendamento: '-', valor: '95,04', conta: '-' },
  { id: 6, doc: '52708', beneficiario: 'Automaxcode solucoes em tecnologia de...', categoria: '1.06 - Vendas Mercado Livre Full', tipo: '-', vencimento: '01/03/2026', agendamento: '-', valor: '78,99', conta: '-' },
  { id: 7, doc: '52709', beneficiario: 'Bernard Guimaraes Gervazoni', categoria: '1.06 - Vendas Mercado Livre Full', tipo: '-', vencimento: '01/03/2026', agendamento: '-', valor: '105,00', conta: '-' },
  { id: 8, doc: '52710', beneficiario: 'Fabio Carrettoni', categoria: '1.06 - Vendas Mercado Livre Full', tipo: '-', vencimento: '01/03/2026', agendamento: '-', valor: '39,95', conta: '-' },
  { id: 9, doc: '52711', beneficiario: 'Sueli Alvarenga da Costa', categoria: '1.06 - Vendas Mercado Livre Full', tipo: '-', vencimento: '01/03/2026', agendamento: '-', valor: '180,08', conta: '-' },
  { id: 10, doc: '52712', beneficiario: 'Paulo Tadeu Rogero Do Carmo', categoria: '1.06 - Vendas Mercado Livre Full', tipo: '-', vencimento: '01/03/2026', agendamento: '-', valor: '100,08', conta: '-' },
  { id: 11, doc: '52713', beneficiario: 'Adriano Silva', categoria: '1.01 - Venda no Mercado Livre', tipo: '-', vencimento: '02/03/2026', agendamento: '-', valor: '55,50', conta: '-' },
  { id: 12, doc: '52714', beneficiario: 'Beatriz Oliveira', categoria: '1.06 - Vendas Mercado Livre Full', tipo: '-', vencimento: '02/03/2026', agendamento: '-', valor: '120,00', conta: '-' },
  { id: 13, doc: '52715', beneficiario: 'Carlos Eduardo', categoria: '1.06 - Vendas Mercado Livre Full', tipo: '-', vencimento: '02/03/2026', agendamento: '-', valor: '45,90', conta: '-' },
  { id: 14, doc: '52716', beneficiario: 'Daniela Souza', categoria: '1.01 - Venda no Mercado Livre', tipo: '-', vencimento: '02/03/2026', agendamento: '-', valor: '89,99', conta: '-' },
  { id: 15, doc: '52717', beneficiario: 'Erick Santos', categoria: '1.06 - Vendas Mercado Livre Full', tipo: '-', vencimento: '03/03/2026', agendamento: '-', valor: '210,00', conta: '-' },
  { id: 16, doc: '52718', beneficiario: 'Fernanda Lima', categoria: '1.01 - Venda no Mercado Livre', tipo: '-', vencimento: '03/03/2026', agendamento: '-', valor: '34,00', conta: '-' },
  { id: 17, doc: '52719', beneficiario: 'Gabriel Rocha', categoria: '1.06 - Vendas Mercado Livre Full', tipo: '-', vencimento: '03/03/2026', agendamento: '-', valor: '77,20', conta: '-' },
  { id: 18, doc: '52720', beneficiario: 'Helena Costa', categoria: '1.06 - Vendas Mercado Livre Full', tipo: '-', vencimento: '03/03/2026', agendamento: '-', valor: '99,90', conta: '-' },
  { id: 19, doc: '52721', beneficiario: 'Igor Gomes', categoria: '1.01 - Venda no Mercado Livre', tipo: '-', vencimento: '04/03/2026', agendamento: '-', valor: '62,45', conta: '-' },
  { id: 20, doc: '52722', beneficiario: 'Juliana Paes', categoria: '1.06 - Vendas Mercado Livre Full', tipo: '-', vencimento: '04/03/2026', agendamento: '-', valor: '150,00', conta: '-' },
  { id: 21, doc: '52723', beneficiario: 'Kleber Macedo', categoria: '1.06 - Vendas Mercado Livre Full', tipo: '-', vencimento: '04/03/2026', agendamento: '-', valor: '42,00', conta: '-' },
  { id: 22, doc: '52724', beneficiario: 'Larissa Manoela', categoria: '1.01 - Venda no Mercado Livre', tipo: '-', vencimento: '04/03/2026', agendamento: '-', valor: '115,80', conta: '-' },
  { id: 23, doc: '52725', beneficiario: 'Marcos Mion', categoria: '1.06 - Vendas Mercado Livre Full', tipo: '-', vencimento: '05/03/2026', agendamento: '-', valor: '300,00', conta: '-' },
  { id: 24, doc: '52726', beneficiario: 'Nathalia Dill', categoria: '1.01 - Venda no Mercado Livre', tipo: '-', vencimento: '05/03/2026', agendamento: '-', valor: '25,50', conta: '-' },
  { id: 25, doc: '52727', beneficiario: 'Otavio Mesquita', categoria: '1.06 - Vendas Mercado Livre Full', tipo: '-', vencimento: '05/03/2026', agendamento: '-', valor: '88,00', conta: '-' },
  { id: 26, doc: '52728', beneficiario: 'Patricia Abravanel', categoria: '1.06 - Vendas Mercado Livre Full', tipo: '-', vencimento: '05/03/2026', agendamento: '-', valor: '54,30', conta: '-' },
  { id: 27, doc: '52729', beneficiario: 'Quintino Gomes', categoria: '1.01 - Venda no Mercado Livre', tipo: '-', vencimento: '06/03/2026', agendamento: '-', valor: '10,99', conta: '-' },
  { id: 28, doc: '52730', beneficiario: 'Rafael Portugal', categoria: '1.06 - Vendas Mercado Livre Full', tipo: '-', vencimento: '06/03/2026', agendamento: '-', valor: '44,90', conta: '-' },
  { id: 29, doc: '52731', beneficiario: 'Sabrina Sato', categoria: '1.01 - Venda no Mercado Livre', tipo: '-', vencimento: '06/03/2026', agendamento: '-', valor: '132,00', conta: '-' },
  { id: 30, doc: '52732', beneficiario: 'Tiago Leifert', categoria: '1.06 - Vendas Mercado Livre Full', tipo: '-', vencimento: '06/03/2026', agendamento: '-', valor: '75,00', conta: '-' },
  { id: 31, doc: '52733', beneficiario: 'Ursula Bezerra', categoria: '1.06 - Vendas Mercado Livre Full', tipo: '-', vencimento: '07/03/2026', agendamento: '-', valor: '20,00', conta: '-' },
  { id: 32, doc: '52734', beneficiario: 'Viviane Araujo', categoria: '1.01 - Venda no Mercado Livre', tipo: '-', vencimento: '07/03/2026', agendamento: '-', valor: '88,88', conta: '-' },
  { id: 33, doc: '52735', beneficiario: 'Wagner Moura', categoria: '1.06 - Vendas Mercado Livre Full', tipo: '-', vencimento: '07/03/2026', agendamento: '-', valor: '250,00', conta: '-' },
  { id: 34, doc: '52736', beneficiario: 'Xuxa Meneghel', categoria: '1.01 - Venda no Mercado Livre', tipo: '-', vencimento: '07/03/2026', agendamento: '-', valor: '1000,00', conta: '-' },
  { id: 35, doc: '52737', beneficiario: 'Yudi Tamashiro', categoria: '1.06 - Vendas Mercado Livre Full', tipo: '-', vencimento: '08/03/2026', agendamento: '-', valor: '400,00', conta: '-' },
  { id: 36, doc: '52738', beneficiario: 'Zeca Pagodinho', categoria: '1.06 - Vendas Mercado Livre Full', tipo: '-', vencimento: '08/03/2026', agendamento: '-', valor: '15,00', conta: '-' },
  { id: 37, doc: '52739', beneficiario: 'Anitta da Silva', categoria: '1.01 - Venda no Mercado Livre', tipo: '-', vencimento: '08/03/2026', agendamento: '-', valor: '66,60', conta: '-' },
  { id: 38, doc: '52740', beneficiario: 'Bruno Gagliasso', categoria: '1.06 - Vendas Mercado Livre Full', tipo: '-', vencimento: '08/03/2026', agendamento: '-', valor: '82,30', conta: '-' },
  { id: 39, doc: '52741', beneficiario: 'Caio Castro', categoria: '1.01 - Venda no Mercado Livre', tipo: '-', vencimento: '09/03/2026', agendamento: '-', valor: '44,00', conta: '-' },
  { id: 40, doc: '52742', beneficiario: 'Deborah Secco', categoria: '1.06 - Vendas Mercado Livre Full', tipo: '-', vencimento: '09/03/2026', agendamento: '-', valor: '91,10', conta: '-' },
];

export function ViewPartners({ initialId }) {
  const router = useRouter();
  const { selecteds, onSelect, onSelectAll } = useTable(mockClientes);

  // Local state for immediate modal feedback
  const [selectedId, setSelectedId] = React.useState(initialId);

  // Sync local state when initialId changes (e.g., F5 or back/forward)
  React.useEffect(() => {
    setSelectedId(initialId);
  }, [initialId]);

  const handleRowDoubleClick = (row) => {
    // Immediate state update for responsiveness
    setSelectedId(row.id);
    // URL sync for persistence
    router.push(`/registers/partners/${row.id}`);
  };

  const handleCloseModal = () => {
    setSelectedId(undefined);
    router.push('/registers/partners');
  };

  const handleSave = () => {
    alert('Alterações salvas com sucesso!');
    handleCloseModal();
  };

  const columns = [
    { field: 'doc', headerName: 'Nº Doc.' },
    {
      field: 'beneficiario',
      headerName: 'Beneficiário',
      sx: { color: 'primary.main', fontWeight: 500 }
    },
    { field: 'categoria', headerName: 'Categoria' },
    { field: 'tipo', headerName: 'Tipo', align: 'center' },
    { field: 'vencimento', headerName: 'Vencimento' },
    { field: 'agendamento', headerName: 'Agendamento', align: 'center' },
    { field: 'valor', headerName: 'Valor', sx: { fontWeight: 600 } },
    { field: 'conta', headerName: 'Agência / Conta' },
  ];

  const primaryActions = [
    { label: 'Adicionar', icon: <AddIcon />, variant: 'contained', color: 'primary', onClick: () => setSelectedId(null) },
    { label: 'Importar', icon: <CloudUploadIcon />, variant: 'inherit', color: 'text', onClick: () => { } },
  ];

  const secondaryActions = [
    { label: 'Mês atual', icon: <CalendarIcon />, color: 'inherit', variant: 'text', onClick: () => { } },
    { label: 'Filtros', icon: <FilterIcon />, color: 'inherit', variant: 'text', onClick: () => { } },
    { label: 'Pesquisar', icon: <SearchIcon />, color: 'primary', variant: 'outlined', onClick: () => { } },
  ];

  return (
    <ViewContainer
      title={<Title items={[{ label: 'Cadastros' }, { label: 'Clientes' }]} />}
      footer={<Footer total={40} />}
    >

      <Toolbar
        primary={primaryActions}
        secondary={secondaryActions}
      />

      <Table
        columns={columns}
        items={mockClientes}
        selecteds={selecteds}
        onSelect={onSelect}
        onSelectAll={onSelectAll}
        onRowDoubleClick={handleRowDoubleClick}
      />

      <PartnerDetail 
        partnerId={selectedId}
        onClose={handleCloseModal}
        onSave={handleSave}
      />

    </ViewContainer>
  );
}
