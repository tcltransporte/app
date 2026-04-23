'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Grid,
  TextField,
  Typography,
} from '@mui/material';
import { VerifiedUser as CertificateIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import Swal from 'sweetalert2';

import { DragAndDrop } from '@/components/DragAndDrop';
import { LoadingOverlay } from '@/components/common';
import * as certificateAction from '@/app/actions/settings/certificate.action';
import { ServiceStatus } from '@/libs/service';

export function CertificateTab() {
  const [backdropMessage, setBackdropMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [certificate, setCertificate] = useState(null);

  const fetchCertificate = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await certificateAction.findOne();
      if (result.header.status !== ServiceStatus.SUCCESS) {
        throw new Error(result.body?.message || 'Erro ao carregar certificado.');
      }
      setCertificate(result.body.certificate);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCertificate();
  }, [fetchCertificate]);

  const handleUpload = async (files) => {
    try {
      if (files.length > 0) {
        const { value: password } = await Swal.fire({
          title: 'Senha do certificado',
          input: 'password',
          inputLabel: 'Informe a senha do arquivo PFX',
          inputPlaceholder: 'Senha',
          showCancelButton: true,
          confirmButtonText: 'Enviar',
          cancelButtonText: 'Cancelar',
          inputAttributes: { autocapitalize: 'off', autocorrect: 'off' },
        });

        if (password === undefined) return;

        if (!password || !String(password).trim()) {
          await Swal.fire({
            icon: 'warning',
            title: 'Ops!',
            text: 'É necessário informar a senha do certificado!',
            confirmButtonText: 'Ok',
          });
          return;
        }

        const file = files[0];
        setBackdropMessage('Carregando arquivo PFX...');
        const result = await certificateAction.submit({
          file,
          password: String(password),
        });

        if (result.header.status !== ServiceStatus.SUCCESS) {
          throw new Error(result.body?.message || 'Erro ao salvar certificado.');
        }

        await Swal.fire({ icon: 'success', text: 'Certificado atualizado com sucesso!' });
        if (result.body?.expired) {
          await Swal.fire({
            icon: 'warning',
            title: 'Atenção',
            text: 'Este certificado está vencido.',
            confirmButtonText: 'Ok',
          });
        }
      } else {
        const result = await Swal.fire({
          text: 'Tem certeza que deseja excluir?',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Sim',
          cancelButtonText: 'Não',
        });

        if (!result.isConfirmed) return;

        setBackdropMessage('Excluindo certificado...');
        const del = await certificateAction.destroy();
        if (del.header.status !== ServiceStatus.SUCCESS) {
          throw new Error(del.body?.message || 'Erro ao excluir certificado.');
        }

        await Swal.fire({ icon: 'success', text: 'Certificado excluído com sucesso!' });
      }

      await fetchCertificate();
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        text: error?.body?.message || error?.message || 'Erro inesperado.',
      });
    } finally {
      setBackdropMessage('');
    }
  };

  return (
    <>
      <LoadingOverlay open={Boolean(backdropMessage)} title={backdropMessage || 'Aguarde...'} subtitle="" />

      <Card elevation={0} sx={{ border: 'none', boxShadow: 'none' }}>
        <CardHeader
          sx={{ display: isLoading ? 'none' : 'block', px: 0, pt: 0 }}
          avatar={
            <CertificateIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          }
          title={
            <Typography variant="h6" fontWeight={600}>
              Certificado digital
            </Typography>
          }
          subheader={
            certificate
              ? 'Visualize os dados e faça upload de um novo certificado'
              : 'Nenhum certificado digital foi configurado'
          }
        />
        <CardContent sx={{ px: 0, pb: 0 }}>
          {isLoading ? (
            <Box display="flex" justifyContent="center" my={4}>
              <CircularProgress size={30} />
            </Box>
          ) : (
            <>
              <DragAndDrop
                files={certificate ? [certificate] : []}
                title="Arquivo PFX"
                accept=".pfx"
                disabled={Boolean(backdropMessage)}
                onChange={(next) => handleUpload(next)}
              />

              <Grid container spacing={3}>
                {certificate && (
                  <>
                    <Grid size={{ xs: 12, sm: 5.4 }}>
                      <TextField
                        fullWidth
                        variant="filled"
                        label="Referência"
                        value={certificate.subject?.CN || ''}
                        InputProps={{ readOnly: true }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <TextField
                        fullWidth
                        variant="filled"
                        label="Serial"
                        value={certificate.serialNumber || ''}
                        InputProps={{ readOnly: true }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 1.8 }}>
                      <TextField
                        fullWidth
                        variant="filled"
                        label="Emitido em"
                        value={
                          certificate.validFrom
                            ? format(new Date(certificate.validFrom), 'dd/MM/yyyy HH:mm:ss')
                            : ''
                        }
                        InputProps={{ readOnly: true }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 1.8 }}>
                      <TextField
                        fullWidth
                        variant="filled"
                        label="Expira em"
                        value={
                          certificate.validUntil
                            ? format(new Date(certificate.validUntil), 'dd/MM/yyyy HH:mm:ss')
                            : ''
                        }
                        InputProps={{ readOnly: true }}
                      />
                    </Grid>
                  </>
                )}
              </Grid>
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
