'use client';

import React from 'react';
import * as XLSX from 'xlsx';
import { alert } from '@/libs/alert';
import { ServiceStatus } from '@/libs/service';
import Swal from 'sweetalert2';

export const ExportFormat = {
  EXCEL: 'excel',
  GOOGLE_SHEETS: 'sheets'
};

export const useExport = () => {
  const [exporting, setExporting] = React.useState(false);

  /**
   * Processes a server response for export (Base64 file or Google Sheets URL)
   */
  const processResponse = async (result, { fileName = 'export', format = ExportFormat.EXCEL } = {}) => {
    try {
      if (result.header.status !== ServiceStatus.SUCCESS) {
        throw result;
      }

      // Handle Server-side Excel Download (Base64)
      if (format === ExportFormat.EXCEL && result.body.base64) {
        const byteCharacters = atob(result.body.base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${fileName}_${new Date().getTime()}.xlsx`;
        link.click();
        
        alert.success('Arquivo baixado com sucesso!');
        return;
      }

      // Handle Google Sheets URL
      if (format === ExportFormat.GOOGLE_SHEETS && result.body.url) {
        alert.success('Planilha criada com sucesso!');
        const confirmed = await alert.confirm(
          'Abrir Google Sheets?',
          'Deseja abrir a planilha criada agora?',
          'question'
        );
        if (confirmed) {
          window.open(result.body.url, '_blank');
        }
        return;
      }
    } catch (error) {
      console.error('--- EXPORT ERROR DEBUG ---');
      console.error('Result object:', JSON.stringify(result, null, 2));
      console.error('Error caught:', error);
      
      // Await the auth error handler to prevent Next.js from throwing 
      // unhandled promise rejection warnings/errors during state transitions
      await handleAuthError(error, () => processResponse(result, { fileName, format }));
      
      if (error && error.code !== 'GOOGLE_AUTH_REQUIRED') {
        alert.error('Erro ao exportar', error?.body?.message || error.message || 'Ocorreu um problema ao processar o arquivo.');
      }
    }
  };

  /**
   * Generates and downloads Excel purely on client-side
   */
  const downloadClientSide = (items, columns, { fileName = 'export', sheetName = 'Sheet1' } = {}) => {
    try {
      if (items.length === 0) {
        alert.error('Exportar', 'Nenhum dado encontrado para exportação.');
        return;
      }

      const exportColumns = columns.filter(col => col.field && col.headerName);

      const data = items.map(item => {
        const row = {};
        exportColumns.forEach(col => {
          let value = item[col.field];
          if (col.exportFormatter) {
            value = col.exportFormatter(value, item);
          } else if (typeof value === 'boolean') {
            value = value ? 'Sim' : 'Não';
          } else if (col.field.toLowerCase().includes('date') && value) {
            try {
              value = new Date(value).toLocaleDateString('pt-BR');
            } catch (e) {}
          }
          row[col.headerName] = value;
        });
        return row;
      });

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      XLSX.writeFile(workbook, `${fileName}_${new Date().getTime()}.xlsx`);
      alert.success('Arquivo exportado com sucesso!');
    } catch (error) {
      console.error('Erro client-side export:', error);
      alert.error('Erro ao exportar', 'Problema ao gerar arquivo local.');
    }
  };

  const handleAuthError = async (error, retryFn) => {
    if (error && error.code === 'GOOGLE_AUTH_REQUIRED') {
      try {
        const urlResp = await fetch('/api/auth/google/url');
        if (!urlResp.ok) throw new Error('Falha ao obter URL de autenticação');
        
        const { url } = await urlResp.json();
        if (!url) throw new Error('URL de autenticação não retornada');

      Swal.fire({
        title: 'Conexão Necessária',
        html: `
          <p style="margin-bottom: 20px;">Você precisa conectar sua conta Google para exportar diretamente para o Sheets.</p>
          <button id="swal-google-connect" class="swal2-confirm swal2-styled" style="background-color: #4285F4; color: white; padding: 12px 24px; font-weight: bold; border-radius: 8px; cursor: pointer;">
            Conectar com Google
          </button>
        `,
        showConfirmButton: false,
        showCancelButton: true,
        cancelButtonText: 'Agora não',
        customClass: {
          popup: 'swal2-modal-custom',
          cancelButton: 'swal2-cancel-custom',
        },
        didOpen: () => {
          const btn = document.getElementById('swal-google-connect');
          btn.addEventListener('click', () => {
            const width = 600;
            const height = 700;
            const left = window.screen.width / 2 - width / 2;
            const top = window.screen.height / 2 - height / 2;
            
            const popup = window.open(
              url, 
              'google-auth', 
              `width=${width},height=${height},left=${left},top=${top}`
            );

            if (!popup) {
              alert.error('Bloqueador de Popups', 'O navegador bloqueou a janela.');
              return;
            }

            const handleMessage = async (event) => {
              if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
                window.removeEventListener('message', handleMessage);
                Swal.close();
                alert.success('Conectado com sucesso!');
                if (retryFn) retryFn();
              }
            };
            window.addEventListener('message', handleMessage);
          });
        }
      });
    } catch (err) {
      console.error('Erro ao preparar conexão Google:', err);
      alert.error('Erro de Conexão', 'Não foi possível preparar o login com Google.');
    }
  }
};

  return {
    processResponse,
    downloadClientSide,
    exporting,
    setExporting
  };
};
