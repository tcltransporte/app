"use client"

import { useState } from "react"

//services
import * as loginController from "@/app/controllers/login.controller"
import * as companyController from "@/app/controllers/settings/company.controller"

//exception
import { ErrorRender } from "@/libs/errors/error-render"

export function SettingsView({ initialCompany }) {
    try {

        const [company, setCompany] = useState(initialCompany)

        const handleRefresh = async () => {
    
            const company = await companyController.findOne()
    
            setCompany(company)
    
        }
    
        return (
            <div style={{ padding: "20px" }}>
                <h1>Olá, {company?.user?.name}</h1>
                <p>Filial: {company?.name}</p>
                <p>Grupo: {company?.companyBusiness?.name}</p>
                <form action={loginController.signOut}><button type="button" onClick={handleRefresh}>Atualizar</button><button type="submit">Sair</button></form>
            </div>
        )
    
    } catch (error) {
        return <ErrorRender error={error} />
    }
}