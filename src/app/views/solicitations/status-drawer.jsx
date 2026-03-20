import React from 'react';
import { Drawer, Box, Typography, IconButton, Divider, Button, Tabs, Tab, Checkbox as MuiCheckbox, FormControlLabel } from '@mui/material';
import { Close as CloseIcon, Settings as SettingsIcon, SwapHoriz as WorkflowIcon } from '@mui/icons-material';
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
  const [tab, setTab] = React.useState(0);
  const [statuses, setStatuses] = React.useState([]);
  const [allStatuses, setAllStatuses] = React.useState([]);
  const [relationships, setRelationships] = React.useState([]);
  const [configFromStatus, setConfigFromStatus] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      // Fetch allowed transitions for the "Change Status" tab
      solicitationService.findAllowedTransitions(fromStatusIds)
        .then(result => {
          if (result.status === ServiceStatus.SUCCESS) {
            setStatuses(result.items || []);
          }
        });

      // Fetch all statuses and current relationships for the "Config" tab
      solicitationService.findAllStatuses().then(res => res.status === ServiceStatus.SUCCESS && setAllStatuses(res.items || []));
      solicitationService.findAllStatusRelationships().then(res => res.status === ServiceStatus.SUCCESS && setRelationships(res.items || []));
    }
  }, [open, fromStatusIds]);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      for (const id of selectedIds) {
        const result = await solicitationService.update(id, {
          statusId: values.statusId,
          description: values.observation
        });
        if (result.status !== ServiceStatus.SUCCESS) throw result;
      }
      alert.success('Status alterado com sucesso!');
      onSave();
      onClose();
    } catch (error) {
      alert.error('Erro ao alterar status', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWorkflow = async () => {
    if (!configFromStatus) return;
    setLoading(true);
    try {
      const allowedToIds = relationships
        .filter(r => r.fromStatusId === parseInt(configFromStatus))
        .map(r => r.toStatusId);
      
      const result = await solicitationService.updateStatusRelationships(parseInt(configFromStatus), allowedToIds);
      if (result.status === ServiceStatus.SUCCESS) {
        alert.success('Fluxo atualizado!');
        // Refresh allowed transitions for the main tab if needed
        solicitationService.findAllowedTransitions(fromStatusIds).then(res => res.status === ServiceStatus.SUCCESS && setStatuses(res.items || []));
      } else {
        throw result;
      }
    } catch (error) {
      alert.error('Erro ao salvar fluxo', error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleWorkflowRule = (toId) => {
    const fromId = parseInt(configFromStatus);
    const exists = relationships.some(r => r.fromStatusId === fromId && r.toStatusId === toId);
    if (exists) {
      setRelationships(relationships.filter(r => !(r.fromStatusId === fromId && r.toStatusId === toId)));
    } else {
      setRelationships([...relationships, { fromStatusId: fromId, toStatusId: toId }]);
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
          <Typography variant="h6" fontWeight={700}>Status & Fluxo</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        
        <Tabs value={tab} onChange={(e, v) => setTab(v)} variant="fullWidth">
          <Tab icon={<WorkflowIcon fontSize="small" />} label="Alterar" iconPosition="start" sx={{ textTransform: 'none', minHeight: 48 }} />
          <Tab icon={<SettingsIcon fontSize="small" />} label="Configurar" iconPosition="start" sx={{ textTransform: 'none', minHeight: 48 }} />
        </Tabs>
        <Divider />

        {tab === 0 && (
          <Formik
            initialValues={{
              statusId: '',
              observation: ''
            }}
            onSubmit={handleSubmit}
          >
            {({ submitForm }) => (
              <Form style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
                <Box sx={{ p: 3, flexGrow: 1, overflowY: 'auto' }}>
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
                      <Field
                        component={SelectField}
                        name="statusId"
                        label="Status"
                        options={statuses.map(s => ({ value: s.id, label: s.description }))}
                      />
                    )}

                    <Field
                      component={TextField}
                      name="observation"
                      label="Observação"
                      fullWidth
                      multiline
                      rows={4}
                    />
                  </Box>
                </Box>

                <Divider />
                <Box sx={{ p: 2, display: 'flex', gap: 2 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="inherit"
                    onClick={onClose}
                    disabled={loading}
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={submitForm}
                    disabled={loading || statuses.length === 0}
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                  >
                    {loading ? 'Salvando...' : 'Salvar'}
                  </Button>
                </Box>
              </Form>
            )}
          </Formik>
        )}

        {tab === 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
            <Box sx={{ p: 3, flexGrow: 1, overflowY: 'auto' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Configure quais transições de status são permitidas.
                </Typography>

                <SelectField
                  label="Status de Origem"
                  fullWidth
                  value={configFromStatus}
                  onChange={(val) => setConfigFromStatus(val)}
                  options={allStatuses.map(s => ({ value: s.id, label: s.description }))}
                />

                {configFromStatus && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="subtitle2" fontWeight={700}>Transições permitidas para:</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', ml: 1 }}>
                      {allStatuses.map(s => (
                        <FormControlLabel
                          key={s.id}
                          control={
                            <MuiCheckbox
                              size="small"
                              checked={relationships.some(r => r.fromStatusId === parseInt(configFromStatus) && r.toStatusId === s.id)}
                              onChange={() => toggleWorkflowRule(s.id)}
                            />
                          }
                          label={<Typography variant="body2">{s.description}</Typography>}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
            <Divider />
            <Box sx={{ p: 2 }}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleSaveWorkflow}
                disabled={loading || !configFromStatus}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                {loading ? 'Salvando Fluxo...' : 'Salvar Configuração'}
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Drawer>
  );
}
