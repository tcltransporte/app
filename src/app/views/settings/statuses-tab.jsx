'use client';

import React from 'react';
import { Box, Typography, Button, IconButton, Drawer, Divider, Tabs, Tab, Checkbox as MuiCheckbox, FormControlLabel } from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  SwapHoriz as WorkflowIcon,
  Category as TypesIcon
} from '@mui/icons-material';
import { Formik, Form, Field } from 'formik';
import { TextField, SelectField } from '@/components/controls';
import { Table, LoadingOverlay } from '@/components/common';
import { useTable } from '@/hooks';
import * as companyService from '@/app/services/settings/company.service';
import { ServiceStatus } from '@/libs/service';
import { alert } from '@/libs/alert';

export function StatusesTab({ initialStatusesConfig }) {
  const initialTable = React.useMemo(() => ({
    items: initialStatusesConfig?.allStatuses || []
  }), [initialStatusesConfig]);
  const table = useTable({ initialTable });
  const [drawer, setDrawer] = React.useState({ open: false, item: null, tab: 0 });

  // Config state
  const [allStatuses, setAllStatuses] = React.useState(initialStatusesConfig?.allStatuses || []);
  const [allTypes, setAllTypes] = React.useState(initialStatusesConfig?.allTypes || []);
  const [relationships, setRelationships] = React.useState(initialStatusesConfig?.relationships || []);
  const [typeRelationships, setTypeRelationships] = React.useState(initialStatusesConfig?.typeRelationships || []);
  const [configFromType, setConfigFromType] = React.useState('');
  const [configLoading, setConfigLoading] = React.useState(false);

  const { setLoading, setItems } = table;
  const fetchConfig = React.useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const result = await companyService.getStatusesConfig();
      if (result.header.status === ServiceStatus.SUCCESS) {
        setAllStatuses(result.body.allStatuses || []);
        setAllTypes(result.body.allTypes || []);
        setRelationships(result.body.relationships || []);
        setTypeRelationships(result.body.typeRelationships || []);
        setItems(result.body.allStatuses || []);
      }
    } catch (error) {
      alert.error('Erro ao recarregar configuração', error?.header?.message || error.message);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [setLoading, setItems]);

  const isFirstMount = React.useRef(true);
  React.useEffect(() => {
    if (isFirstMount.current && initialStatusesConfig) {
      isFirstMount.current = false;
      return;
    }
    fetchConfig();
  }, [fetchConfig, initialStatusesConfig]);

  const handleOpenDrawer = (item = null, tab = 0) => {
    setConfigFromType('');
    setDrawer({ open: true, item, tab });
  };

  const handleCloseDrawer = (shouldFetch = true) => {
    setDrawer({ open: false, item: null, tab: 0 });
    if (shouldFetch) fetchConfig(); // Resets local checkbox states
  };

  const handleSave = async (values) => {
    try {
      const statusId = drawer.item ? drawer.item.id : null;
      
      const toIds = relationships.filter(r => r.fromStatusId === statusId).map(r => r.toStatusId);
      const typeIds = typeRelationships.filter(r => r.statusId === statusId).map(r => r.typeId);

      const result = await companyService.saveStatusConfig({
        id: statusId,
        description: values.description,
        workflowIds: toIds,
        typeIds,
        isInitialOption: values.isInitialOption
      });

      if (result.header.status !== ServiceStatus.SUCCESS) throw result;

      alert.success(drawer.item ? 'Status atualizado com sucesso!' : 'Status criado com sucesso!');
      handleCloseDrawer(false);
      fetchConfig(true);
    } catch (error) {
      alert.error('Erro ao salvar', error?.header?.message || error.message);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await alert.confirm('Excluir Status', 'Deseja realmente excluir este status?');
    if (!confirmed) return;
    table.setLoading(true);
    try {
      const result = await companyService.destroyStatus(id);
      if (result.header.status !== ServiceStatus.SUCCESS) throw result;
      alert.success('Status excluído!');
      fetchTable();
      fetchConfig();
    } catch (error) {
      alert.error('Erro ao excluir', error?.header?.message || error.message);
    } finally {
      table.setLoading(false);
    }
  };

  const getWorkflowFromId = () => drawer.item ? drawer.item.id : null;

  const toggleWorkflowRule = (toId) => {
    const fromId = getWorkflowFromId();
    const exists = relationships.some(r => r.fromStatusId === fromId && r.toStatusId === toId);
    if (exists) {
      setRelationships(relationships.filter(r => !(r.fromStatusId === fromId && r.toStatusId === toId)));
    } else {
      setRelationships([...relationships, { fromStatusId: fromId, toStatusId: toId }]);
    }
  };

  const toggleTypeRelation = (statusId) => {
    const typeId = parseInt(configFromType);
    const exists = typeRelationships.some(r => r.statusId === statusId && r.typeId === typeId);
    if (exists) {
      setTypeRelationships(typeRelationships.filter(r => !(r.statusId === statusId && r.typeId === typeId)));
    } else {
      setTypeRelationships([...typeRelationships, { statusId, typeId }]);
    }
  };

  const columns = [
    { field: 'description', label: 'Descrição', minWidth: 200 },
    { 
      field: 'actions', 
      label: 'Ações', 
      align: 'right',
      width: 160,
      renderCell: (value, row) => (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
          <IconButton size="small" title="Editar" onClick={(e) => { e.stopPropagation(); handleOpenDrawer(row, 0); }}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" title="Tipos" onClick={(e) => { e.stopPropagation(); handleOpenDrawer(row, 0); }}>
            <TypesIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" title="Workflow" onClick={(e) => { e.stopPropagation(); handleOpenDrawer(row, 1); }}>
            <WorkflowIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error" title="Excluir" onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      )
    }
  ];

  return (
    <Box sx={{ position: 'relative' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h6" fontWeight={700}>Status de Solicitação</Typography>
          <Typography variant="body2" color="text.secondary">
            Gerencie os status, fluxo de transições e vínculo com tipos.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDrawer()}
          sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
        >
          Novo Status
        </Button>
      </Box>

      <Table
        columns={columns}
        items={table.items}
        loading={table.loading}
      />

      {/* Drawer */}
      <Drawer
        anchor="right"
        open={drawer.open}
        onClose={handleCloseDrawer}
        PaperProps={{ sx: { width: { xs: '100%', sm: 420 } } }}
        sx={{ zIndex: (theme) => theme.zIndex.modal + 1 }}
      >
        <Box sx={{ height: '100%' }}>
          <Formik
            initialValues={{ 
              description: drawer.item?.description || '',
              isInitialOption: relationships.some(r => r.fromStatusId === null && r.toStatusId === drawer.item?.id)
            }}
            onSubmit={handleSave}
            enableReinitialize
          >
            {({ submitForm, isSubmitting, values, setFieldValue }) => {
              const currentStatusId = drawer.item?.id || null;
              const currentDescription = values.description || 'Novo Status';

              const showWorkflow = drawer.tab === 1;
              const showTipos = drawer.tab === 0;

              return (
              <Form style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ px: 3, pt: 2.5, pb: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="h6" fontWeight={700}>
                    {currentDescription}
                  </Typography>
                  <IconButton onClick={handleCloseDrawer} size="small">
                    <CloseIcon />
                  </IconButton>
                </Box>

                <Box sx={{ p: 3, pb: 2 }}>
                  <Field component={TextField} name="description" label="Descrição" fullWidth autoFocus />
                  <FormControlLabel
                    control={
                      <MuiCheckbox
                        size="small"
                        checked={values.isInitialOption}
                        onChange={(e) => setFieldValue('isInitialOption', e.target.checked)}
                      />
                    }
                    label={<Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>Permitir como status inicial (sem status)</Typography>}
                    sx={{ mt: 1 }}
                  />
                </Box>

                  <React.Fragment>
                    <Tabs
                      value={drawer.tab}
                      onChange={(e, v) => setDrawer(d => ({ ...d, tab: v }))}
                      variant="scrollable"
                      scrollButtons="auto"
                      sx={{ px: 2, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minHeight: 44 } }}
                    >
                      <Tab icon={<TypesIcon fontSize="small" />} label="Tipos" iconPosition="start" />
                      <Tab icon={<WorkflowIcon fontSize="small" />} label="Workflow" iconPosition="start" />
                    </Tabs>
                    <Divider />
                  </React.Fragment>

                {/* TAB 1: Workflow */}
                {showWorkflow && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
                    <Box sx={{ p: 3, flexGrow: 1, overflowY: 'auto' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Selecione para quais status <strong>{currentDescription}</strong> pode transitar.
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        {allStatuses.filter(s => s.id !== currentStatusId).map(s => (
                          <FormControlLabel
                            key={s.id}
                            control={
                              <MuiCheckbox
                                size="small"
                                checked={relationships.some(r => r.fromStatusId === currentStatusId && r.toStatusId === s.id)}
                                onChange={() => toggleWorkflowRule(s.id)}
                              />
                            }
                            label={<Typography variant="body2">{s.description}</Typography>}
                          />
                        ))}
                      </Box>
                    </Box>
                  </Box>
                )}

                {/* TAB 0: Tipos */}
                {showTipos && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
                    <Box sx={{ p: 3, flexGrow: 1, overflowY: 'auto' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Selecione os tipos de solicitação que permitem o status <strong>{currentDescription}</strong>.
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        {allTypes.map(t => (
                          <FormControlLabel
                            key={t.id}
                            control={
                              <MuiCheckbox
                                size="small"
                                checked={typeRelationships.some(r => r.statusId === currentStatusId && r.typeId === t.id)}
                                onChange={() => setTypeRelationships(prev => {
                                  const exists = prev.some(r => r.statusId === currentStatusId && r.typeId === t.id);
                                  if (exists) return prev.filter(r => !(r.statusId === currentStatusId && r.typeId === t.id));
                                  return [...prev, { statusId: currentStatusId, typeId: t.id }];
                                })}
                              />
                            }
                            label={<Typography variant="body2">{t.description}</Typography>}
                          />
                        ))}
                      </Box>
                    </Box>
                  </Box>
                )}

                {/* Drawer Footer Actions */}
                <Box sx={{ mt: 'auto', p: 2, display: 'flex', gap: 2, borderTop: 1, borderColor: 'divider' }}>
                  <Button fullWidth variant="outlined" color="inherit" onClick={handleCloseDrawer} sx={{ textTransform: 'none', fontWeight: 600 }}>
                    Cancelar
                  </Button>
                  <Button fullWidth variant="contained" startIcon={<SaveIcon />} onClick={submitForm} disabled={isSubmitting} sx={{ textTransform: 'none', fontWeight: 600 }}>
                    {isSubmitting ? 'Salvando...' : 'Salvar'}
                  </Button>
                </Box>
              </Form>
              );
            }}
          </Formik>
        </Box>
      </Drawer>

    </Box>
  );
}
