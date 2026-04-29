/**
 * Gera DANFE em PDF (base64) a partir de XML(s).
 * Uso recomendado no server-side (actions/services).
 *
 * @param {object} params
 * @param {string[]} params.xmls - Array de XMLs (string XML puro ou base64 do XML).
 * @param {string|null} [params.logoBase64=null] - Logo em base64 (sem prefixo data URI).
 * @param {string} [params.endpoint] - Endpoint do serviço DANFE. Padrão: process.env.DANFE_ENDPOINT.
 * @returns {Promise<string>} - PDF em base64.
 */
export async function generateDanfePdfBase64({
  xmls,
  logoBase64 = null,
  endpoint = 'http://global.tcltransporte.com.br:9000/sped-da/danfe.php',
}) {

  console.log('--- DANFE DEBUG ---')
  console.log('xmls', xmls)
  console.log('logoBase64', logoBase64)
  console.log('endpoint', endpoint)
  console.log('--- DANFE DEBUG ---')

  if (!Array.isArray(xmls) || xmls.length === 0) {
    throw new Error('Informe ao menos um XML para gerar o DANFE.')
  }

  const preparedXmls = xmls
    .map((x) => String(x ?? '').trim())
    .filter(Boolean)

  if (preparedXmls.length === 0) {
    throw new Error('Nenhum XML válido foi informado para gerar o DANFE.')
  }

  const url = String(endpoint ?? '').trim()
  if (!url) {
    throw new Error('Endpoint DANFE não configurado. Defina DANFE_ENDPOINT ou informe endpoint na função.')
  }

  const body = {
    logo: logoBase64 ? String(logoBase64).trim() : '',
    xmls: preparedXmls,
  }

  console.log('--- DANFE DEBUG ---')
  console.log('body', body)
  console.log('--- DANFE DEBUG ---')

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  console.log('--- DANFE DEBUG ---')
  console.log('response', response.ok)
  console.log('--- DANFE DEBUG ---')

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Erro ao gerar DANFE (${response.status}): ${errText}`)
  }

  const pdfArrayBuffer = await response.arrayBuffer()
  return Buffer.from(pdfArrayBuffer).toString('base64')
}
