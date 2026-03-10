"use client"

import { useState } from "react"

//services
import * as loginService from "@/app/services/login.service"
import * as companyService from "@/app/services/settings/company.service"
import { ServiceRequest } from "@/libs/service"
import { useRouter } from "next/navigation"

export function SettingsView({ initialCompany, initialUser }) {
    try {

        const router = useRouter()

        const [company, setCompany] = useState(initialCompany)
        const [user, setUser] = useState(initialUser)

        const handleRefresh = async () => {
            try {

                const companyResult = await ServiceRequest.run(companyService.findOne())
    
                setCompany(companyResult.company)
                setUser(companyResult.user)

            } catch (error) {
                alert(error.message)
            }
        }

        const handleSignOut = async () => {
            try {

                await ServiceRequest.run(loginService.signOut())

                router.push("/login")
                router.refresh()
    
            } catch (error) {
                alert(error.message)
            }
        }
    
        return (
            <div style={{ padding: "20px" }}>
                <h1>Olá, {user?.userName}</h1>
                <p>Filial: {company?.surname}</p>
                <p>Grupo: {company?.companyBusiness?.name}</p>
                <button type="button" onClick={handleRefresh}>Atualizar</button>
                <button type="button" onClick={handleSignOut}>Sair</button>
            </div>
        )
    
    } catch (error) {
        return <h1>Erro: {error.message}</h1>
    }
}