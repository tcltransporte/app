'use server';

// Mock data to simulate database
const mockClientes = [
  { id: 1, doc: '52692', beneficiario: 'Edson Dos Santos', categoria: '1.06 - Vendas Mercado Livre Full', tipo: '-', vencimento: '01/03/2026', agendamento: '-', valor: '39,95', conta: '-' },
  { id: 2, doc: '52693', beneficiario: 'Edson Dos Santos', categoria: '1.06 - Vendas Mercado Livre Full', tipo: '-', vencimento: '01/03/2026', agendamento: '-', valor: '84,00', conta: '-' },
  { id: 3, doc: '52694', beneficiario: 'Daniel Olivo Pereira', categoria: '1.01 - Venda no Mercado Livre', tipo: '-', vencimento: '01/03/2026', agendamento: '-', valor: '103,84', conta: '-' },
  { id: 4, doc: '52704', beneficiario: 'Eduardo Bertolloti Junior', categoria: '1.06 - Vendas Mercado Livre Full', tipo: '-', vencimento: '01/03/2026', agendamento: '-', valor: '39,95', conta: '-' },
  { id: 5, doc: '52706', beneficiario: 'Daniel Eggerst Zapazo', categoria: '1.06 - Vendas Mercado Livre Full', tipo: '-', vencimento: '01/03/2026', agendamento: '-', valor: '95,04', conta: '-' },
];

export async function getPartner(id) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  if (!id) return null;
  
  const partner = mockClientes.find(p => p.id === Number(id));
  return partner || null;
}
