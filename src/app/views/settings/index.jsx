"use client"

import { useState } from "react"

//services
import * as loginController from "@/app/services/login.service"
import * as companyService from "@/app/services/settings/company.service"
import { ServiceRequest } from "@/libs/service"

export function SettingsView({ initialCompany }) {
    try {

        console.log(initialCompany)

        const [company, setCompany] = useState(initialCompany)

        const handleRefresh = async () => {
    
            const companyResult = await ServiceRequest.run(companyService.findOne())
    
            setCompany(companyResult.company)
    
        }
    
        return (
            <div style={{ padding: "20px" }}>
                <h1>Olá, {company?.user?.name}</h1>
                <p>Filial: {company?.surname}</p>
                <p>Grupo: {company?.companyBusiness?.name}</p>
                <form action={loginController.signOut}><button type="button" onClick={handleRefresh}>Atualizar</button><button type="submit">Sair</button></form>
            </div>
        )
    
    } catch (error) {
        return <h1>Erro: {error.message}</h1>
    }
}