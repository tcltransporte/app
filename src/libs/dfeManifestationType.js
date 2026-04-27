/**
 * Tipos de manifestação DF-e (evento).
 * Use na UI: ManifestationType.Confirmation | ManifestationType.UnknownOperation
 * (objeto serializável com `code` e `label` para server actions).
 */
export const ManifestationType = Object.freeze({
  Confirmation: Object.freeze({
    code: "210200",
    label: "Confirmação da Operação",
  }),

  Awareness: Object.freeze({
    code: "210210",
    label: "Ciência da Operação",
  }),

  UnknownOperation: Object.freeze({
    code: "210220",
    label: "Desconhecimento da Operação",
  }),

  OperationNotPerformed: Object.freeze({
    code: "210240",
    label: "Operação não Realizada",
  }),
});

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
