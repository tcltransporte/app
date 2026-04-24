/**
 * Tipos de manifestação DF-e (evento).
 * Use na UI: ManifestationType.Aceite | ManifestationType.Recusa
 * (objeto serializável com `code` e `label` para server actions).
 */
export const ManifestationType = Object.freeze({
  Aceite: Object.freeze({ code: "210210", label: "Aceite" }),
  Recusa: Object.freeze({ code: "210220", label: "Recusa" }),
})

/** @returns {readonly ("210210"|"210220")[]} */
export function getManifestationCodes() {
  return Object.freeze(Object.values(ManifestationType).map((t) => t.code))
}

/**
 * @param {unknown} value
 * @returns {{ code: string, label: string } | null}
 */
export function normalizeManifestation(value) {
  if (!value || typeof value !== "object") return null
  const code = value.code
  if (typeof code !== "string") return null
  const entry = Object.values(ManifestationType).find((t) => t.code === code)
  return entry || null
}
