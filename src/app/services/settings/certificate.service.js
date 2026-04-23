import { AppContext } from "@/database"
import { getSession } from "@/libs/session"
import * as companyRepository from "@/app/repositories/company.repository"

function parseDN(dnString) {
  if (dnString == null || typeof dnString !== "string") {
    return typeof dnString === "object" && dnString !== null ? dnString : {}
  }
  if (!dnString.trim()) return {}
  return dnString
    .split(",")
    .map((part) => part.trim())
    .map((part) => part.split("="))
    .reduce((acc, parts) => {
      const key = parts[0]
      const value = parts.slice(1).join("=")
      if (!key) return acc
      if (!acc[key]) {
        acc[key] = value
      } else {
        acc[key] = [].concat(acc[key], value)
      }
      return acc
    }, {})
}

function parseStoredCertificate(raw) {
  if (!raw || typeof raw !== "string") return null
  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== "object") return null
    if (!parsed.base64) return null
    return parsed
  } catch {
    return null
  }
}

export async function findOne(transaction) {
  const session = await getSession(transaction)
  const company = await companyRepository.findOne(transaction, {
    attributes: ["id", "certificate"],
    where: { codigo_empresa_filial: session.company.id },
  })

  if (!company?.certificate) return null

  let certificate
  try {
    certificate = JSON.parse(company.certificate)
  } catch {
    return null
  }

  if (!certificate?.base64) return null

  const { password, base64, ...cleanCert } = certificate

  return {
    ...cleanCert,
    subject:
      typeof cleanCert.subject === "string"
        ? parseDN(cleanCert.subject)
        : cleanCert.subject || {},
    issuer:
      typeof cleanCert.issuer === "string"
        ? parseDN(cleanCert.issuer)
        : cleanCert.issuer || {},
  }
}

export async function submit(transaction, { file, password }) {
  const session = await getSession(transaction)
  const db = new AppContext()

  if (!file || typeof file.arrayBuffer !== "function") {
    throw new Error("Arquivo PFX é obrigatório.")
  }
  if (!password || !String(password).trim()) {
    throw new Error("A senha do certificado é obrigatória.")
  }

  const arrayBuffer = await file.arrayBuffer()
  const base64 = Buffer.from(arrayBuffer).toString("base64")

  const response = await fetch(`${process.env.SERVICE_API}/application/services/certificate/info`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Cert-Base64": base64,
      "X-Cert-Password": String(password),
    },
  })

  let info
  try {
    info = await response.json()
  } catch {
    throw new Error("Resposta inválida do serviço de certificado.")
  }

  if (!response.ok) {
    throw new Error(info?.message || `Erro ao validar certificado (${response.status}).`)
  }

  const certificate = {
    name: file.name,
    size: file.size,
    base64,
    password: String(password),
    ...info,
  }

  await db.Company.update(
    { certificate: JSON.stringify(certificate) },
    { where: { id: session.company.id }, transaction }
  )

  return { ok: true, expired: Boolean(info.expired) }
}

export async function destroy(transaction) {
  const session = await getSession(transaction)
  const db = new AppContext()

  await db.Company.update(
    { certificate: null },
    { where: { id: session.company.id }, transaction }
  )

  return { ok: true }
}
