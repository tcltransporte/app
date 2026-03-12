'use client';

import React, { useContext } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Avatar,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  useTheme
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  People,
  AttachMoney,
  Receipt,
  AccountBalance,
  MoreVert,
  NotificationsActive,
  CheckCircle,
  AccountCircle
} from '@mui/icons-material';
import { ThemeContext } from '@/context/ThemeContext';
import { Container } from '@/components/common';

export function DashboardView() {
  const { primaryColor, mode } = useContext(ThemeContext);
  const theme = useTheme();
  const isDark = mode === 'dark';

  const stats = [
    { title: 'Total Clientes', value: '1,284', grow: '+12.5%', icon: <People />, color: primaryColor },
    { title: 'Faturamento', value: 'R$ 45.280', grow: '+8.2%', icon: <AttachMoney />, color: '#10b981' },
    { title: 'Contas a Receber', value: 'R$ 12.450', grow: '-2.4%', icon: <Receipt />, color: '#f59e0b' },
    { title: 'Saldo Bancário', value: 'R$ 89.120', grow: '+1.5%', icon: <AccountBalance />, color: '#6366f1' },
  ];

  const recentActivity = [
    { id: 1, text: 'Novo parceiro cadastrado: Hidráulica Silva', time: '2 horas atrás', icon: <AccountCircle />, color: primaryColor },
    { id: 2, text: 'Nota Fiscal #4582 emitida com sucesso', time: '4 horas atrás', icon: <CheckCircle />, color: '#10b981' },
    { id: 3, text: 'Vencimento de fatura: Fornecedor de Cloro', time: '6 horas atrás', icon: <NotificationsActive />, color: '#ef4444' },
    { id: 4, text: 'Conciliação bancária concluída - Bradesco', time: 'Ontem', icon: <CheckCircle />, color: '#10b981' },
  ];

  return (
    <Container>
      <Container.Title items={[{ label: 'Início' }, { label: 'Dashboard' }]} />
      <Container.Content>
        {/* Welcome Header */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
            Olá, bem-vindo de volta! 👋
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Aqui está o que está acontecendo com sua empresa hoje.
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 2 }}>
          {stats.map((stat, index) => (
            <Grid key={index} size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{
                borderRadius: 4,
                boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.05)',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                overflow: 'visible',
                position: 'relative'
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Avatar sx={{
                      bgcolor: `${stat.color}15`,
                      color: stat.color,
                      width: 48,
                      height: 48,
                      borderRadius: 3
                    }}>
                      {stat.icon}
                    </Avatar>
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      color: stat.grow.startsWith('+') ? '#10b981' : '#ef4444',
                      bgcolor: stat.grow.startsWith('+') ? '#10b98115' : '#ef444415',
                      px: 1,
                      py: 0.5,
                      borderRadius: 1.5,
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}>
                      {stat.grow.startsWith('+') ? <TrendingUp sx={{ fontSize: 14, mr: 0.5 }} /> : <TrendingDown sx={{ fontSize: 14, mr: 0.5 }} />}
                      {stat.grow}
                    </Box>
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    {stat.title}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3}>
          {/* Visual Chart Placeholder */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Paper sx={{
              p: 3,
              borderRadius: 4,
              height: '100%',
              boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.05)',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
              display: 'flex',
              flexDirection: 'column'
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Resumo Financeiro</Typography>
                <IconButton size="small"><MoreVert /></IconButton>
              </Box>

              <Box sx={{
                flexGrow: 1,
                display: 'flex',
                alignItems: 'flex-end',
                gap: 2,
                pt: 4,
                pb: 2,
                px: { xs: 0, sm: 2 }
              }}>
                {/* Simulated Bar Chart */}
                {[40, 70, 45, 90, 65, 80, 50, 85, 45, 75, 60, 95].map((height, i) => (
                  <Box key={i} sx={{
                    flex: 1,
                    height: `${height}%`,
                    bgcolor: i % 2 === 0 ? primaryColor : `${primaryColor}44`,
                    borderRadius: '4px 4px 0 0',
                    minWidth: 10,
                    transition: 'height 1s ease-in-out',
                    '&:hover': { opacity: 0.8, cursor: 'pointer' }
                  }} />
                ))}
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 2, mt: 1 }}>
                {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].map(month => (
                  <Typography key={month} variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    {month}
                  </Typography>
                ))}
              </Box>
            </Paper>
          </Grid>

          {/* Recent Activity */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{
              p: 3,
              borderRadius: 4,
              boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.05)',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
            }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Atividades Recentes</Typography>
              <List disablePadding>
                {recentActivity.map((activity, index) => (
                  <React.Fragment key={activity.id}>
                    <ListItem sx={{ px: 0, py: 1.5 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: `${activity.color}15`, color: activity.color }}>
                          {activity.icon}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={activity.text}
                        secondary={activity.time}
                        primaryTypographyProps={{ variant: 'body2', fontWeight: 600, sx: { mb: 0.5 } }}
                        secondaryTypographyProps={{ variant: 'caption', fontWeight: 500 }}
                      />
                    </ListItem>
                    {index < recentActivity.length - 1 && <Divider component="li" sx={{ opacity: 0.5 }} />}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          </Grid>
        </Grid>
      </Container.Content>
    </Container>
  );
}
