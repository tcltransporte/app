import React from 'react';
import { Drawer, Box, Typography, IconButton, Divider, Button, CircularProgress } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { Formik, Form, Field } from 'formik';
import { SelectField, TextField } from '@/components/controls';
import * as solicitationService from '@/app/services/solicitation.service';
import { alert } from '@/libs/alert';
import { ServiceStatus } from '@/libs/service';

export function StatusDrawer({
  open,
  onClose,
  selectedIds,
  fromStatusIds,
  onSave
}) {
  const [statuses, setStatuses] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setStatuses([]);
      setLoading(true);
      // Fetch allowed transitions for the "Change Status" tab
      solicitationService.findAllowedTransitions(null, fromStatusIds)
        .then(result => {
          if (result.header.status === ServiceStatus.SUCCESS) {
            setStatuses(result.body.items || []);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [open, fromStatusIds]);

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      for (const id of selectedIds) {
        const result = await solicitationService.update(null, id, {
          statusId: values.statusId,
          description: values.observation
        });
        if (result.header.status !== ServiceStatus.SUCCESS) throw result;
      }
      alert.success('Status alterado com sucesso!');
      onSave();
      onClose();
    } catch (error) {
      alert.error('Erro ao alterar status', error?.header?.message || error.message);
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: { xs: '100%', sm: 450 }, p: 0 }
      }}
      sx={{ zIndex: (theme) => theme.zIndex.modal + 1 }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" fontWeight={700}>Alterar Status</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        <Divider />

        <Formik
          initialValues={{
            statusId: '',
            observation: ''
          }}
          onSubmit={handleSubmit}
        >
          {({ submitForm, values }) => (
            <Form style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
              <Box sx={{ p: 3, flexGrow: 1, overflowY: 'auto' }}>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
                    <CircularProgress size={32} />
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      Alterando status de {selectedIds.length} solicitação(ões).
                    </Typography>

                    {statuses.length === 0 && !loading && (
                      <Box sx={{ p: 2, bgcolor: 'error.lighter', borderRadius: 1, border: '1px solid', borderColor: 'error.main' }}>
                        <Typography variant="body2" color="error.main" fontWeight={600}>
                          Nenhuma transição de status permitida para as solicitações selecionadas.
                        </Typography>
                      </Box>
                    )}

                    {statuses.length > 0 && (
                      <>
                        <Field
                          component={SelectField}
                          name="statusId"
                          label="Status"
                          options={statuses.map(s => ({ value: s.id, label: s.description }))}
                        />

                        <Field
                          component={TextField}
                          name="observation"
                          label="Observação"
                          fullWidth
                          multiline
                          rows={4}
                        />
                      </>
                    )}
                  </Box>
                )}
              </Box>

              <Divider />
              <Box sx={{ p: 2, display: 'flex', gap: 2 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  color="inherit"
                  onClick={onClose}
                  disabled={loading || submitting}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  Cancelar
                </Button>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={submitForm}
                  disabled={loading || submitting || !values.statusId}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  {submitting ? 'Confirmando...' : 'Confirmar'}
                </Button>
              </Box>
            </Form>
          )}
        </Formik>

      </Box>
    </Drawer>
  );
}
