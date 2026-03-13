'use client';

import React, { useContext, useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  IconButton,
  useTheme,
  useMediaQuery,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  Business,
  Verified,
  People,
  AccountBalance,
  Category,
  ReceiptLong,
  IntegrationInstructions,
  Group,
  Badge,
  MenuOpen,
  Map,
  Event,
  Info,
  Support,
  Build,
  Storefront,
  Dashboard,
  ConfirmationNumber,
  Assignment,
  AddCircleOutline,
  Save,
  Close,
  CheckCircle,
  RadioButtonUnchecked,
  DragHandle,
  Sort,
  Settings,
  VpnKey,
  Description,
  Extension,
  ExpandMore,
  ChevronRight,
  Edit,
  Check
} from '@mui/icons-material';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Swal from 'sweetalert2';
import { alert } from '@/libs/alert';
import { ThemeContext } from '@/context/ThemeContext';
import { SessionContext } from '@/context/SessionContext';
import { useLayout } from '@/context/LayoutContext';
import { useRouter, usePathname } from 'next/navigation';
import * as solicitationTypeService from '@/app/services/solicitationType.service';
import { ServiceStatus } from '@/libs/service';

const EMPTY_ARRAY = [];

// Added subMenus based on the user's reference image
const menuItems = [
  {
    text: 'Início', icon: <Business />, subMenu: [
      { text: 'Dashboard', icon: <Dashboard />, path: '/' },
      { text: 'Chamados', icon: <ConfirmationNumber /> },
      { text: 'Agenda', icon: <Event /> },
      { text: 'Integrações', icon: <IntegrationInstructions /> },
      { text: 'Sobre a versão', icon: <Info /> },
      { text: 'Ajuda do ERP', icon: <Support /> },
      { text: 'Ferramentas', icon: <Build /> },
      { text: 'Shopping de Serviços', icon: <Storefront /> },
    ]
  },
  {
    text: 'Cadastros', icon: <Verified />, subMenu: [
      { text: 'Clientes', icon: <Group />, path: '/registers/partners' },
      { text: 'Fornecedores', icon: <Badge /> },
    ]
  },
  { text: 'Suprimentos', icon: <People /> },
  {
    text: 'Solicitações', icon: <Assignment />, subMenu: [
      { text: 'Gestão de Tipos', path: '/solicitations/types' }
    ]
  },
  { text: 'Finanças', icon: <Category /> },
  { text: 'Contabilidade', icon: <ReceiptLong /> },
  {
    text: 'Configurações', icon: <Settings />, subMenu: [
      { text: 'Empresa', icon: <Business /> },
      { text: 'Certificado', icon: <VpnKey /> },
      { text: 'Usuários', icon: <Group /> },
      { text: 'Bancos', icon: <AccountBalance /> },
      { text: 'Categorias', icon: <Category /> },
      { text: 'NFS-e', icon: <Description /> },
      { text: 'Integrações', icon: <Extension /> },
    ]
  },
];

export default function Sidebar({ mobileOpen, onMobileClose, session: propSession, initialSolicitationTypes = EMPTY_ARRAY }) {
  const router = useRouter();
  const pathname = usePathname();
  const { menu, setMenu, primaryColor, mode, semiDark } = useContext(ThemeContext);
  const { session: contextSession } = useContext(SessionContext);
  const [isHovered, setIsHovered] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null); // Tracks which menu item's submenu is open

  // propSession is available when drilling down; otherwise use context
  const activeSession = propSession || contextSession;

  const [solicitationTypes, setSolicitationTypes] = useState(initialSolicitationTypes);
  const [showQuickAddForm, setShowQuickAddForm] = useState(false);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [originalSolicitationTypes, setOriginalSolicitationTypes] = useState([]);
  const [quickAddDesc, setQuickAddDesc] = useState('');
  const [quickAddHash, setQuickAddHash] = useState('');
  const [quickAddType, setQuickAddType] = useState(1);
  const [isSavingTipo, setIsSavingTipo] = useState(false);
  const [isSavingOrders, setIsSavingOrders] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Update types if initialSolicitationTypes changes (e.g. on navigation or data refresh)
  React.useEffect(() => {
    if (initialSolicitationTypes && JSON.stringify(initialSolicitationTypes) !== JSON.stringify(solicitationTypes)) {
      setSolicitationTypes(initialSolicitationTypes);
    }
  }, [initialSolicitationTypes]);

  const { isMobile } = useLayout();
  const theme = useTheme();

  // Logic for Semi-Dark theme
  const isDarkMenu = mode === 'dark' || semiDark;
  const sidebarBg = isDarkMenu ? '#2b2c40' : '#ebebeb';
  const sidebarText = isDarkMenu ? 'rgba(255, 255, 255, 0.85)' : 'text.primary';
  const sidebarIcon = isDarkMenu ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary';
  const subMenuBg = isDarkMenu ? '#32344d' : '#ffffff';

  const handleQuickAddSolicitationType = () => {
    setShowQuickAddForm(prev => !prev);
    setQuickAddDesc('');
    setQuickAddHash('');
    setQuickAddType(1);
  };

  const saveQuickAddSolicitationType = async () => {
    if (!quickAddDesc.trim()) {
      alert.error('Erro', 'A descrição é obrigatória');
      return;
    }

    setIsSavingTipo(true);
    try {
      const resp = await solicitationTypeService.create({
        description: quickAddDesc,
        hash: quickAddHash || quickAddDesc.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '-'),
        requestType: quickAddType
      });

      if (resp.status === ServiceStatus.SUCCESS) {
        alert.success('Tipo criado com sucesso!');
        setShowQuickAddForm(false);
        setQuickAddDesc('');
        setQuickAddHash('');

        // Manually refresh local list for immediate feedback
        const refreshResp = await solicitationTypeService.findAll({ limit: 100 });
        if (refreshResp.status === ServiceStatus.SUCCESS) {
          setSolicitationTypes(refreshResp.items || []);
        }

        router.refresh();
      } else {
        alert.error('Erro ao criar tipo', resp.message);
      }
    } catch (err) {
      alert.error('Erro', 'Ocorreu um erro ao salvar');
    } finally {
      setIsSavingTipo(false);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = solicitationTypes.findIndex((t) => t.id === active.id);
      const newIndex = solicitationTypes.findIndex((t) => t.id === over.id);

      const newOrder = arrayMove(solicitationTypes, oldIndex, newIndex);
      setSolicitationTypes(newOrder);
    }
  };

  const saveReorder = async () => {
    setIsSavingOrders(true);
    try {
      const orderPairs = solicitationTypes.map((tipo, index) => ({
        id: tipo.id,
        order: index + 1
      }));

      const resp = await solicitationTypeService.updateOrders(orderPairs);
      if (resp.status === ServiceStatus.SUCCESS) {
        alert.success('Ordem salva com sucesso!');
        setIsReorderMode(false);
        router.refresh();
      } else {
        alert.error('Erro ao salvar ordem', resp.message);
      }
    } catch (error) {
      alert.error('Erro', 'Ocorreu um erro ao salvar a ordem');
    } finally {
      setIsSavingOrders(false);
    }
  };

  const handleStartEdit = (item) => {
    setEditingId(item.id);
    setEditingValue(item.text || '');
  };

  const handleSaveEdit = async (id) => {
    if (!editingValue.trim()) return;

    setIsSavingEdit(true);
    try {
      const resp = await solicitationTypeService.update(id, { description: editingValue });
      if (resp.status === ServiceStatus.SUCCESS) {
        setSolicitationTypes(prev => prev.map(t => t.id === id ? { ...t, description: editingValue } : t));
        setEditingId(null);
        router.refresh();
      } else {
        alert.error('Erro ao atualizar', resp.message);
      }
    } catch (err) {
      alert.error('Erro', 'Ocorreu um erro ao salvar');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const enterReorderMode = () => {
    setOriginalSolicitationTypes(solicitationTypes);
    setIsReorderMode(true);
  };

  const cancelReorder = () => {
    setSolicitationTypes(originalSolicitationTypes);
    setIsReorderMode(false);
  };

  // Combine static menu items with dynamic types
  const dynamicMenuItems = React.useMemo(() => {
    return menuItems.map(item => {
      if (item.text === 'Solicitações') {
        return {
          ...item,
          subMenu: [
            {
              text: 'Todas as Solicitações',
              icon: <Assignment />,
              path: '/solicitations'
            },
            ...solicitationTypes.map(tipo => ({
              id: tipo.id,
              text: tipo.description,
              icon: <Description />,
              path: `/solicitations/${tipo.hash}`
            })),
            solicitationTypes.length === 0 && {
              text: 'Nenhum tipo cadastrado',
              icon: <Info />,
              disabled: true,
              sx: { opacity: 0.5, fontStyle: 'italic' }
            },
            { divider: true },
            !showQuickAddForm && {
              text: isReorderMode ? (isSavingOrders ? 'Salvando...' : 'Salvar Reordenação') : 'Reordenar',
              icon: isSavingOrders ? <CircularProgress size={20} color="inherit" /> : (isReorderMode ? <Save /> : <Sort />),
              action: isReorderMode ? (isSavingOrders ? null : saveReorder) : enterReorderMode
            },
            !showQuickAddForm && isReorderMode && {
              text: 'Cancelar',
              icon: <Close />,
              action: cancelReorder
            },
            !showQuickAddForm && !isReorderMode && {
              text: 'Adicionar Novo',
              icon: <AddCircleOutline />,
              action: handleQuickAddSolicitationType,
              isQuickAddToggle: true
            },
            { isQuickAddForm: showQuickAddForm }
          ].filter(Boolean)
        };
      }
      return item;
    });
  }, [solicitationTypes, primaryColor, isDarkMenu, sidebarText, showQuickAddForm, quickAddDesc, quickAddType, isSavingTipo, isReorderMode, isSavingOrders]);



  // Calculate effective drawer state: if mobile, always show full width.
  const isEffectivelyCollapsed = !isMobile && menu === 'recolhido' && !isHovered;
  const drawerWidth = isEffectivelyCollapsed ? 80 : 280;
  const subMenuWidth = 280;

  const commonTransition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';

  const handleMenuClick = (item) => {
    if (item.subMenu) {
      setActiveMenu(activeMenu === item.text ? null : item.text);
    } else {
      setActiveMenu(null);
    }
  };

  const handleSubItemClick = (subItem) => {
    if (subItem.action) {
      subItem.action();
      if (isMobile) onMobileClose();
    } else if (subItem.path) {
      router.push(subItem.path);
      if (isMobile) onMobileClose();
    }
  };

  const activeItemData = dynamicMenuItems.find(item => item.text === activeMenu);

  function SortableSubItem({ subItem, index, isActiveSub }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging
    } = useSortable({ id: subItem.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      zIndex: isDragging ? 2 : 1,
      opacity: isDragging ? 0.5 : 1,
    };

    const isEditing = editingId === subItem.id;

    return (
      <ListItem
        ref={setNodeRef}
        style={style}
        disablePadding
        sx={{
          mb: 0.5,
          '&:hover .edit-btn': { opacity: 1 }
        }}
      >
        <ListItemButton
          onClick={() => !isReorderMode && !isEditing && handleSubItemClick(subItem)}
          sx={{
            borderRadius: 1,
            minHeight: 40,
            pl: isMobile ? 4 : 2,
            cursor: (isReorderMode || isEditing) ? 'default' : 'pointer',
            color: subItem.action ? primaryColor : (isActiveSub ? primaryColor : (isDarkMenu ? 'rgba(255, 255, 255, 0.7)' : 'text.primary')),
            '& .MuiListItemIcon-root': {
              color: subItem.action ? primaryColor : (isActiveSub ? primaryColor : (isDarkMenu ? 'rgba(255, 255, 255, 0.5)' : 'text.secondary')),
              minWidth: 40
            },
            '&:hover': {
              backgroundColor: isDarkMenu ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0,0,0,0.04)'
            },
            pr: isEditing ? 1 : 2
          }}
        >
          {isReorderMode ? (
            <ListItemIcon {...attributes} {...listeners} sx={{ cursor: 'grab', minWidth: 32 }}>
              <DragHandle sx={{ fontSize: 20 }} />
            </ListItemIcon>
          ) : (
            subItem.icon && (
              <ListItemIcon>
                {React.cloneElement(subItem.icon, { sx: { fontSize: 20 } })}
              </ListItemIcon>
            )
          )}

          {isEditing ? (
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 0.5, minWidth: 0, overflow: 'hidden' }}>
              <input
                autoFocus
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveEdit(subItem.id);
                  if (e.key === 'Escape') setEditingId(null);
                }}
                style={{
                  flex: 1,
                  minWidth: 0,
                  width: '100%',
                  padding: '4px 8px',
                  fontSize: '14px',
                  borderRadius: '4px',
                  border: '1px solid ' + primaryColor,
                  backgroundColor: isDarkMenu ? 'rgba(255,255,255,0.05)' : '#fff',
                  color: isDarkMenu ? '#fff' : '#333',
                  outline: 'none'
                }}
              />
              <IconButton
                size="small"
                onClick={() => !isSavingEdit && handleSaveEdit(subItem.id)}
                sx={{ color: primaryColor }}
                disabled={isSavingEdit}
              >
                {isSavingEdit ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <Check sx={{ fontSize: 18 }} />
                )}
              </IconButton>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
              <ListItemText primary={subItem.text} primaryTypographyProps={{ fontSize: 15, fontWeight: subItem.action ? 700 : 500 }} />
              {!isReorderMode && subItem.id && (
                <IconButton
                  className="edit-btn"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartEdit(subItem);
                  }}
                  sx={{
                    opacity: 0,
                    transition: 'opacity 0.2s',
                    p: 0.5,
                    color: isDarkMenu ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                    '&:hover': { color: primaryColor }
                  }}
                >
                  <Edit sx={{ fontSize: 16 }} />
                </IconButton>
              )}
            </Box>
          )}
        </ListItemButton>
      </ListItem>
    );
  }

  const renderSubMenuContent = (items) => {
    const reorderableItems = items.filter(i => i.id !== undefined);
    const otherItems = items.filter(i => i.id === undefined);

    return (
      <List component="div" disablePadding>
        {isReorderMode ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={reorderableItems.map(i => i.id)}
              strategy={verticalListSortingStrategy}
            >
              {reorderableItems.map((subItem, index) => (
                <SortableSubItem
                  key={subItem.id}
                  subItem={subItem}
                  index={index}
                  isActiveSub={subItem.path === pathname}
                />
              ))}
            </SortableContext>
            {/* Render actions (Reorder Finish, etc) after reorderable list */}
            {otherItems
              .filter(i => i.divider || i.text) // Only render dividers or items with text
              .map((subItem, index) => {
                if (subItem.divider) return <Divider key={`div-${index}`} sx={{ my: 1, borderColor: isDarkMenu ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }} />;
                return (
                  <ListItem key={subItem.text || index} disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton
                      onClick={() => handleSubItemClick(subItem)}
                      sx={{
                        borderRadius: 1, minHeight: 40, pl: isMobile ? 4 : 2,
                        color: primaryColor,
                        '& .MuiListItemIcon-root': { color: primaryColor, minWidth: 40 }
                      }}
                    >
                      {subItem.icon && (
                        <ListItemIcon>{React.cloneElement(subItem.icon, { sx: { fontSize: 20 } })}</ListItemIcon>
                      )}
                      <ListItemText primary={subItem.text} primaryTypographyProps={{ fontSize: 15, fontWeight: 700 }} />
                    </ListItemButton>
                  </ListItem>
                );
              })}
          </DndContext>
        ) : (
          items.map((subItem, index) => {
            if (subItem.divider) {
              return <Divider key={`div-${index}`} sx={{ my: 1, borderColor: isDarkMenu ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }} />;
            }

            if (subItem.isQuickAddForm !== undefined) {
              if (!subItem.isQuickAddForm) return null;
              return (
                <Box key="quick-add-form" sx={{ p: 2, mb: 1, borderRadius: '12px', backgroundColor: isDarkMenu ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px dashed', borderColor: primaryColor + '44', position: 'relative' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: primaryColor, textTransform: 'uppercase', fontSize: '10px' }}>
                      Nova Solicitação
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => setShowQuickAddForm(false)}
                      sx={{ p: 0.5, color: isDarkMenu ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)', '&:hover': { color: primaryColor } }}
                    >
                      <Close sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>
                  <input
                    placeholder="Descrição"
                    value={quickAddDesc}
                    onChange={(e) => setQuickAddDesc(e.target.value)}
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid ' + (isDarkMenu ? 'rgba(255,255,255,0.1)' : '#ddd'),
                      backgroundColor: isDarkMenu ? 'rgba(255,255,255,0.05)' : '#fff',
                      color: isDarkMenu ? '#fff' : '#333',
                      fontSize: '14px',
                      marginBottom: '12px',
                      outline: 'none'
                    }}
                  />
                  <input
                    placeholder="Hash/URL (ex: fretes)..."
                    value={quickAddHash}
                    onChange={(e) => setQuickAddHash(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid ' + (isDarkMenu ? 'rgba(255,255,255,0.1)' : '#ddd'),
                      backgroundColor: isDarkMenu ? 'rgba(255,255,255,0.05)' : '#fff',
                      color: isDarkMenu ? '#fff' : '#333',
                      fontSize: '14px',
                      marginBottom: '12px',
                      outline: 'none'
                    }}
                  />
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Box
                      onClick={() => setQuickAddType(1)}
                      sx={{
                        flex: 1, p: 1, borderRadius: '8px', cursor: 'pointer', textAlign: 'center',
                        border: '1px solid', borderColor: quickAddType === 1 ? primaryColor : (isDarkMenu ? 'rgba(255,255,255,0.1)' : '#ddd'),
                        backgroundColor: quickAddType === 1 ? primaryColor + '11' : 'transparent',
                        color: quickAddType === 1 ? primaryColor : (isDarkMenu ? 'rgba(255,255,255,0.5)' : '#666'),
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, fontSize: '12px', fontWeight: 600
                      }}
                    >
                      {quickAddType === 1 ? <CheckCircle sx={{ fontSize: 14 }} /> : <RadioButtonUnchecked sx={{ fontSize: 14 }} />}
                      Entrada
                    </Box>
                    <Box
                      onClick={() => setQuickAddType(2)}
                      sx={{
                        flex: 1, p: 1, borderRadius: '8px', cursor: 'pointer', textAlign: 'center',
                        border: '1px solid', borderColor: quickAddType === 2 ? primaryColor : (isDarkMenu ? 'rgba(255,255,255,0.1)' : '#ddd'),
                        backgroundColor: quickAddType === 2 ? primaryColor + '11' : 'transparent',
                        color: quickAddType === 2 ? primaryColor : (isDarkMenu ? 'rgba(255,255,255,0.5)' : '#666'),
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, fontSize: '12px', fontWeight: 600
                      }}
                    >
                      {quickAddType === 2 ? <CheckCircle sx={{ fontSize: 14 }} /> : <RadioButtonUnchecked sx={{ fontSize: 14 }} />}
                      Saída
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex' }}>
                    <ListItemButton
                      disabled={isSavingTipo}
                      onClick={saveQuickAddSolicitationType}
                      sx={{
                        flex: 1, borderRadius: '8px', backgroundColor: primaryColor, color: '#fff',
                        '&:hover': { backgroundColor: primaryColor + 'dd' },
                        justifyContent: 'center', py: 0.7, minHeight: 'unset'
                      }}
                    >
                      <Save sx={{ fontSize: 16, mr: 1 }} />
                      <Typography sx={{ fontSize: '13px', fontWeight: 700 }}>{isSavingTipo ? 'Salvando...' : 'Salvar'}</Typography>
                    </ListItemButton>
                  </Box>
                </Box>
              );
            }

            const isActiveSub = subItem.path === pathname;
            const isEditing = editingId === subItem.id;

            return (
              <React.Fragment key={subItem.text || index}>
                <ListItem
                  disablePadding
                  sx={{
                    mb: 0.5,
                    '&:hover .edit-btn': { opacity: 1 }
                  }}
                >
                  <ListItemButton
                    disabled={subItem.disabled}
                    onClick={() => !isEditing && !subItem.disabled && handleSubItemClick(subItem)}
                    sx={{
                      borderRadius: 1,
                      minHeight: 40,
                      pl: isMobile ? 4 : 2, // indent on mobile
                      cursor: (isEditing || subItem.disabled) ? 'default' : 'pointer',
                      color: subItem.action ? primaryColor : (isActiveSub ? primaryColor : (isDarkMenu ? 'rgba(255, 255, 255, 0.7)' : 'text.primary')),
                      '& .MuiListItemIcon-root': {
                        color: subItem.action ? primaryColor : (isActiveSub ? primaryColor : (isDarkMenu ? 'rgba(255, 255, 255, 0.5)' : 'text.secondary')),
                        minWidth: 40
                      },
                      '&:hover': {
                        backgroundColor: (isDarkMenu || subItem.disabled) ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0,0,0,0.04)'
                      },
                      pr: isEditing ? 1 : 2,
                      ...subItem.sx
                    }}
                  >
                    {subItem.icon && (
                      <ListItemIcon>
                        {React.cloneElement(subItem.icon, { sx: { fontSize: 20 } })}
                      </ListItemIcon>
                    )}

                    {isEditing ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 0.5, minWidth: 0, overflow: 'hidden' }}>
                        <input
                          autoFocus
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit(subItem.id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                          style={{
                            flex: 1,
                            minWidth: 0,
                            width: '100%',
                            padding: '4px 8px',
                            fontSize: '14px',
                            borderRadius: '4px',
                            border: '1px solid ' + primaryColor,
                            backgroundColor: isDarkMenu ? 'rgba(255,255,255,0.05)' : '#fff',
                            color: isDarkMenu ? '#fff' : '#333',
                            outline: 'none'
                          }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => !isSavingEdit && handleSaveEdit(subItem.id)}
                          sx={{ color: primaryColor }}
                          disabled={isSavingEdit}
                        >
                          {isSavingEdit ? (
                            <CircularProgress size={18} color="inherit" />
                          ) : (
                            <Check sx={{ fontSize: 18 }} />
                          )}
                        </IconButton>
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                        <ListItemText primary={subItem.text} primaryTypographyProps={{ fontSize: 15, fontWeight: subItem.action ? 700 : 500 }} />
                        {subItem.id && (
                          <IconButton
                            className="edit-btn"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartEdit(subItem);
                            }}
                            sx={{
                              opacity: 0,
                              transition: 'opacity 0.2s',
                              p: 0.5,
                              color: isDarkMenu ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                              '&:hover': { color: primaryColor }
                            }}
                          >
                            <Edit sx={{ fontSize: 16 }} />
                          </IconButton>
                        )}
                      </Box>
                    )}
                  </ListItemButton>
                </ListItem>
                {subItem.text === 'Ferramentas' && !isMobile && (
                  <Divider sx={{ my: 1, borderColor: isDarkMenu ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }} />
                )}
              </React.Fragment>
            );
          })
        )}
      </List>
    );
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', color: sidebarText }}>
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: isEffectivelyCollapsed ? 'center' : 'space-between',
        p: 2,
        height: 64, // Matches Header height
      }}>
        {!isEffectivelyCollapsed && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 32,
              height: 32,
              borderRadius: '8px',
              backgroundColor: primaryColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '12px',
              boxShadow: `0 4px 8px ${primaryColor}44`
            }}>{activeSession?.company?.surname?.substring(0, 2).toUpperCase() || 'EMP'}</Box>
            <Typography variant="h6" sx={{ fontSize: '1.05rem', fontWeight: 700, letterSpacing: '-0.02em', color: sidebarText }}>
              {activeSession?.company?.surname || 'Empresa'}
            </Typography>
          </Box>
        )}
        {isEffectivelyCollapsed && (
          <Box sx={{
            width: 38,
            height: 38,
            borderRadius: '8px',
            backgroundColor: primaryColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '14px',
            boxShadow: `0 4px 12px ${primaryColor}66`
          }}>{activeSession?.company?.surname?.substring(0, 2).toUpperCase() || 'EMP'}</Box>
        )}
      </Box>

      <List sx={{ flexGrow: 1, px: 2, pt: 2 }}>
        {dynamicMenuItems.map((item) => {
          const isSelected = activeMenu === item.text;

          return (
            <React.Fragment key={item.text}>
              <ListItem disablePadding sx={{ mb: 1 }}>
                <ListItemButton
                  onClick={() => handleMenuClick(item)}
                  selected={isSelected}
                  sx={{
                    minHeight: 46,
                    borderRadius: '12px',
                    justifyContent: isEffectivelyCollapsed ? 'center' : 'initial',
                    px: isEffectivelyCollapsed ? 0 : 2,
                    mx: isEffectivelyCollapsed ? 1 : 0,
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    overflow: 'visible',
                    backgroundColor: 'transparent',
                    '&.Mui-selected': {
                      backgroundColor: subMenuBg,
                      color: primaryColor,
                      boxShadow: isDarkMenu
                        ? 'none'
                        : (isMobile ? 'none' : '0 8px 16px -4px rgba(0,0,0,0.1)'),
                      zIndex: isMobile ? 1 : 2,
                      // The "pop out" and "connection" effect
                      ...(isSelected && !isMobile && {
                        borderTopRightRadius: 0,
                        borderBottomRightRadius: 0,
                        width: 'calc(100% + 16px)', // Extend to reach the drawer edge (List has px: 2)
                        mr: -2, // Pull to the right edge
                        backgroundColor: subMenuBg,
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: -40,
                          right: 0,
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          backgroundColor: 'transparent',
                          boxShadow: `20px 20px 0 0 ${subMenuBg}`,
                          pointerEvents: 'none'
                        },
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          bottom: -40,
                          right: 0,
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          backgroundColor: 'transparent',
                          boxShadow: `20px -20px 0 0 ${subMenuBg}`,
                          zIndex: 3,
                          pointerEvents: 'none'
                        }
                      }),
                      '& .MuiListItemText-root .MuiTypography-root': {
                        fontWeight: 700
                      },
                      '& .MuiListItemIcon-root': {
                        color: primaryColor
                      },
                      '&:hover': {
                        backgroundColor: subMenuBg,
                      }
                    },
                    '&:hover': {
                      backgroundColor: isDarkMenu ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0,0,0,0.04)',
                      transform: isEffectivelyCollapsed ? 'scale(1.05)' : 'none'
                    }
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: isEffectivelyCollapsed ? 0 : 2,
                      justifyContent: 'center',
                      color: isSelected ? primaryColor : sidebarIcon,
                    }}
                  >
                    {React.cloneElement(item.icon, { sx: { fontSize: 22 } })}
                  </ListItemIcon>
                  {!isEffectivelyCollapsed && (
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: isSelected ? primaryColor : (isDarkMenu ? 'rgba(255, 255, 255, 0.8)' : 'inherit')
                      }}
                    />
                  )}

                  {!isEffectivelyCollapsed && item.subMenu && (
                    isMobile ? (
                      isSelected ? <ExpandMore fontSize="small" /> : <ChevronRight fontSize="small" />
                    ) : (
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          backgroundColor: isSelected ? primaryColor : (isDarkMenu ? 'rgba(255,255,255,0.2)' : 'divider'),
                          ml: 1
                        }}
                      />
                    )
                  )}
                </ListItemButton>
              </ListItem>

              {/* Render mobile accordion submenu directly inline */}
              {isMobile && item.subMenu && isSelected && (
                <Box sx={{ mb: 2, ml: 1 }}>
                  {renderSubMenuContent(item.subMenu)}
                </Box>
              )}
            </React.Fragment>
          );
        })}
      </List>
    </Box>
  );

  const subMenuContent = activeItemData && !isMobile && (
    <Box sx={{ width: subMenuWidth, height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: subMenuBg, color: sidebarText }}>
      <Box sx={{
        height: 64,
        display: 'flex',
        alignItems: 'center',
        px: 3,
        borderBottom: '1px solid',
        borderColor: isDarkMenu ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
      }}>
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 'bold',
            fontSize: '1.2rem',
            color: primaryColor,
            textTransform: 'lowercase',
            letterSpacing: '0.02em'
          }}
        >
          {activeItemData.text}
        </Typography>
      </Box>
      <Box sx={{ p: 2, flexGrow: 1 }}>
        {renderSubMenuContent(activeItemData.subMenu)}
      </Box>
    </Box>
  );

  const handleMouseLeaveNav = () => {
    setIsHovered(false);
    setActiveMenu(null); // When leaving the entire nav area, close any desktop submenus
  };

  return (
    <Box
      component="nav"
      sx={{ display: 'flex', flexShrink: 0, position: 'relative' }}
      onMouseLeave={handleMouseLeaveNav}
    >
      <Box sx={{ width: { md: menu === 'recolhido' ? 80 : 280 }, transition: commonTransition }}>
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={onMobileClose}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: 280,
              backgroundColor: sidebarBg,
              color: sidebarText,
              borderRight: 'none'
            },
          }}
        >
          {drawerContent}
        </Drawer>

        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              transition: commonTransition,
              overflowX: 'visible', // Allows the selected item to pop out
              borderRight: 'none', // Remove the dividing line to create a seamless connection
              backgroundColor: sidebarBg,
              boxShadow: (isDarkMenu && !activeMenu) ? '4px 0 10px rgba(0,0,0,0.1)' : 'none',
              overflow: 'hidden' // Root paper should not scroll, internal elements should
            },
          }}
          open
          onMouseEnter={() => setIsHovered(true)}
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Sub Menu Overlay Drawer (Desktop Only) */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            pointerEvents: activeMenu ? 'auto' : 'none',
            zIndex: theme.zIndex.drawer - 1,
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: subMenuWidth,
              left: drawerWidth,
              transition: commonTransition,
              transform: activeMenu ? 'translateX(0)' : 'translateX(-100%)', // Slide out from behind
              visibility: activeMenu ? 'visible' : 'hidden',
              boxShadow: activeMenu ? '4px 0px 8px rgba(0,0,0,0.05)' : 'none',
              border: 'none',
              backgroundColor: subMenuBg,
              overflow: 'hidden'
            },
          }}
          open={Boolean(activeMenu)}
        >
          {subMenuContent}
        </Drawer>
      )}
    </Box>
  );
}
