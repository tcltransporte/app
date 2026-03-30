"use client"

import { useState } from "react"

//services
import * as loginService from "@/app/services/login.service"
import * as companyService from "@/app/services/settings/company.service"
import { ServiceStatus } from "@/libs/service"
import { useRouter } from "next/navigation"
import { Container } from "@/components/common"
import { Typography, Box, Tabs, Tab, Paper, Avatar, IconButton } from "@mui/material"
import { 
    Apartment as CompanyIcon, 
    VerifiedUser as CertificateIcon, 
    People as UsersIcon, 
    AccountBalance as BanksIcon, 
    Category as CategoriesIcon, 
    Receipt as NfseIcon, 
    Link as IntegrationsIcon,
    ExitToApp as LogoutIcon,
    Cached as RefreshIcon,
    Rule as StatusIcon
} from "@mui/icons-material"

import { CompanyTab } from "./company-tab"
import { StatusesTab } from "./statuses-tab"
import { PlaceholderTab } from "./placeholder-tab"

export function SettingsView({ initialCompany, initialUser, activeSlug = 'empresa', initialStatusesConfig }) {
    try {

        const router = useRouter()

        const [company, setCompany] = useState(initialCompany)
        const [user, setUser] = useState(initialUser)

        const handleRefresh = async () => {
            try {
                const companyResult = await companyService.findOne({})
                if (companyResult.header.status !== ServiceStatus.SUCCESS) throw companyResult
                setCompany(companyResult.body.company)
                setUser(companyResult.body.user)
            } catch (error) {
                alert(error?.body?.message || error.message)
            }
        }

        const handleSignOut = async () => {
            try {
                await loginService.signOut({})
                router.push("/sign-in")
                router.refresh()
            } catch (error) {
                alert(error?.body?.message || error.message)
            }
        }

        const handleSaveCompany = async (values) => {
            console.log('Saving company:', values);
            // Implement update logic when ready
        }

        const tabs = [
            { label: 'Empresa', slug: 'empresa', icon: <CompanyIcon fontSize="small" />, component: <CompanyTab company={company} onSave={handleSaveCompany} /> },
            { label: 'Status', slug: 'status', icon: <StatusIcon fontSize="small" />, component: <StatusesTab initialStatusesConfig={initialStatusesConfig} /> },
            { label: 'Certificado', slug: 'certificado', icon: <CertificateIcon fontSize="small" />, component: <PlaceholderTab title="Certificado" /> },
            { label: 'Usuários', slug: 'usuarios', icon: <UsersIcon fontSize="small" />, component: <PlaceholderTab title="Usuários" /> },
            { label: 'Bancos', slug: 'bancos', icon: <BanksIcon fontSize="small" />, component: <PlaceholderTab title="Bancos" /> },
            { label: 'Categorias', slug: 'categorias', icon: <CategoriesIcon fontSize="small" />, component: <PlaceholderTab title="Categorias" /> },
            { label: 'NFS-e', slug: 'nfs-e', icon: <NfseIcon fontSize="small" />, component: <PlaceholderTab title="NFS-e" /> },
            { label: 'Integrações', slug: 'integracoes', icon: <IntegrationsIcon fontSize="small" />, component: <PlaceholderTab title="Integrações" /> },
        ]

        const activeTabIndex = tabs.findIndex(t => t.slug === activeSlug);
        const currentTab = activeTabIndex === -1 ? 0 : activeTabIndex;

        const handleTabChange = (event, newValue) => {
            const selectedSlug = tabs[newValue].slug;
            router.push(`/settings/${selectedSlug}`);
        };

        return (
            <Container>

                <Container.Title items={[{ label: 'Configurações' }]}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                            {user?.userName} / <Box component="span" fontWeight={600}>{company?.surname} - MATRIZ</Box>
                        </Typography>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 14 }}>
                            {user?.userName?.charAt(0).toUpperCase()}
                        </Avatar>
                        <IconButton onClick={handleRefresh} size="small" title="Atualizar">
                            <RefreshIcon fontSize="small" />
                        </IconButton>
                        <IconButton onClick={handleSignOut} size="small" title="Sair" color="error">
                            <LogoutIcon fontSize="small" />
                        </IconButton>
                    </Box>
                </Container.Title>

                <Container.Content>

                    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                        <Tabs 
                            value={currentTab} 
                            onChange={handleTabChange}
                            variant="scrollable"
                            scrollButtons="auto"
                            sx={{ 
                                minHeight: 48,
                                '& .MuiTab-root': { 
                                    textTransform: 'none', 
                                    fontWeight: 600, 
                                    minWidth: 120,
                                    minHeight: 48,
                                    gap: 1
                                } 
                            }}
                        >
                            {tabs.map((tab, idx) => (
                                <Tab key={idx} icon={tab.icon} label={tab.label} iconPosition="start" />
                            ))}
                        </Tabs>
                    </Box>

                    <Paper elevation={0} sx={{ p: 4, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                        {tabs[currentTab].component}
                    </Paper>

                </Container.Content>

            </Container>
        )

    } catch (error) {
        return <h1>Erro: {error?.body?.message || error.message}</h1>
    }
}