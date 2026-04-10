import { alert } from '@/libs/alert'

/**
 * Handle search exceptions
 */
function exception(error) {
    if (error.name === 'AbortError') {
        return []
    }
    
    alert.error('Erro na pesquisa', error.message)
    return []
}

async function fetchSearch(endpoint, body, signal) {
    try {
        const response = await fetch(`/api/search/${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
            signal
        })

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.message || 'Erro desconhecido na pesquisa')
        }

        return data

    } catch (error) {
        return exception(error)
    }
}

export const accountPlan = (body, signal) => fetchSearch('account-plan', body, signal)
export const bankAccount = (body, signal) => fetchSearch('bank-account', body, signal)
export const company = (body, signal) => fetchSearch('company', body, signal)
export const costCenter = (body, signal) => fetchSearch('cost-center', body, signal)
export const document = (body, signal) => fetchSearch('document', body, signal)
export const partner = (body, signal) => fetchSearch('partner', body, signal)
export const product = (body, signal) => fetchSearch('product', body, signal)
export const service = (body, signal) => fetchSearch('service', body, signal)
export const solicitationStatus = (body, signal) => fetchSearch('solicitation-status', body, signal)

// Regional/Legacy API compatibility
export const city = (body, signal) => fetchSearch('city', body, signal)
export const state = (body, signal) => fetchSearch('state', body, signal)
export const user = (body, signal) => fetchSearch('user', body, signal)
export const bank = (body, signal) => fetchSearch('bank', body, signal)
export const nfseOperation = (body, signal) => fetchSearch('nfse-operation', body, signal)
export const nfseTributation = (body, signal) => fetchSearch('nfse-tributation', body, signal)
export const financialCategory = (body, signal) => fetchSearch('financial-category', body, signal)
export const fundMethod = (body, signal) => fetchSearch('fund-method', body, signal)
export const typeCte = (body, signal) => fetchSearch('type-cte', body, signal)