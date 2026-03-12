"use client"

import { useState } from "react"

//services
import * as loginService from "@/app/services/login.service"
import * as companyService from "@/app/services/settings/company.service"
import { ServiceStatus } from "@/libs/service"
import { useRouter } from "next/navigation"
import { Container } from "@/components/common"
import { Typography, Breadcrumbs, Box } from "@mui/material"

export function SettingsView({ initialCompany, initialUser }) {
    try {

        const router = useRouter()

        const [company, setCompany] = useState(initialCompany)
        const [user, setUser] = useState(initialUser)

        const handleRefresh = async () => {
            try {

                const companyResult = await companyService.findOne()

                if (companyResult.status !== ServiceStatus.SUCCESS) {
                    throw companyResult
                }

                setCompany(companyResult.company)
                setUser(companyResult.user)

            } catch (error) {
                alert(error.message)
            }
        }

        const handleSignOut = async () => {
            try {

                await loginService.signOut()

                router.push("/login")
                router.refresh()

            } catch (error) {
                alert(error.message)
            }
        }

        return (
            <Container>

                <Container.Title items={[{ label: 'Ajustes' }]} />

                <Container.Content>

                    <Box sx={{ p: 1, flexGrow: 1, overflowY: 'auto' }}>
                        <h1>Olá, {user?.userName}</h1>
                        <p>Filial: {company?.surname}</p>
                        <p>Grupo: {company?.companyBusiness?.name}</p>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button type="button" onClick={handleRefresh}>Atualizar</button>
                            <button type="button" onClick={handleSignOut}>Sair</button>
                        </div>
                    </Box>

                </Container.Content>

            </Container>
        )

    } catch (error) {
        return <h1>Erro: {error.message}</h1>
    }
}