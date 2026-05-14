/**
 * Extrai dados principais de XML de CT-e (com ou sem namespaces).
 * @param {string} rawXml
 * @returns {object} Campos alinhados ao modelo Sequelize `Cte` (camelCase).
 */
export function parseCteXml(rawXml) {
  const xml = String(rawXml || '').trim()
  if (!xml) {
    throw new Error('XML vazio')
  }

  const hasCte = /<(?:[\w.-]+:)?CTe(?:\s|>)/i.test(xml) || /<(?:[\w.-]+:)?cteProc(?:\s|>)/i.test(xml)
  if (!hasCte) {
    throw new Error('O arquivo não parece ser um CT-e (elemento CTe não encontrado)')
  }

  const NS = '(?:[\\w.-]+:)?'

  const pick = (src, tag) => {
    const re = new RegExp(`<${NS}${tag}>([^<]*)</${NS}${tag}>`, 'i')
    const m = String(src).match(re)
    return m ? m[1].trim() : null
  }

  const pickInBlock = (block, tag) => (block ? pick(block, tag) : null)

  let ctKey = pick(xml, 'chCTe')
  if (!ctKey || !/^\d{44}$/.test(ctKey)) {
    const idMatch = xml.match(/Id\s*=\s*["']CTe(\d{44})["']/i)
    if (idMatch) ctKey = idMatch[1]
  }
  if (!ctKey || !/^\d{44}$/.test(ctKey)) {
    throw new Error('Chave do CT-e (44 dígitos) não encontrada no XML')
  }

  const protMatch = xml.match(
    new RegExp(`<${NS}protCTe[^>]*>([\\s\\S]*?)</${NS}protCTe>`, 'i')
  )
  const protBlock = protMatch ? protMatch[1] : ''

  let statusCode = pickInBlock(protBlock, 'cStat')
  if (statusCode != null && statusCode !== '') {
    const n = parseInt(statusCode, 10)
    statusCode = Number.isNaN(n) ? null : n
  } else {
    statusCode = null
  }

  const reason = pickInBlock(protBlock, 'xMotivo') || pick(xml, 'xMotivo')
  const protocolNumber = pickInBlock(protBlock, 'nProt') || pick(xml, 'nProt')

  const ideMatch = xml.match(new RegExp(`<${NS}ide[^>]*>([\\s\\S]*?)</${NS}ide>`, 'i'))
  const ide = ideMatch ? ideMatch[1] : xml

  const ctNumberRaw = pick(ide, 'nCT')
  const ctNumber = ctNumberRaw != null && ctNumberRaw !== '' ? parseInt(ctNumberRaw, 10) : null

  const serieRaw = pick(ide, 'serie')
  const ctSeries = serieRaw != null && serieRaw !== '' ? parseInt(serieRaw, 10) : null

  const cctRaw = pick(ide, 'cCT')
  const ctCode = cctRaw != null && cctRaw !== '' ? parseInt(cctRaw, 10) : null

  const dhEmi = pick(ide, 'dhEmi')
  let issuedAt = null
  if (dhEmi) {
    const d = new Date(dhEmi)
    issuedAt = Number.isNaN(d.getTime()) ? null : d
  }

  const description = pick(ide, 'natOp') || pick(ide, 'xDetRetira') || null

  const cteTypeRaw = pick(ide, 'tpCTe')
  const cteTypeId = cteTypeRaw != null && cteTypeRaw !== '' ? parseInt(cteTypeRaw, 10) : null

  const cfopRaw = pick(ide, 'CFOP')
  let cfop = null
  if (cfopRaw != null && cfopRaw !== '') {
    const n = parseInt(cfopRaw, 10)
    cfop = Number.isNaN(n) ? null : n
  }

  const vTPrestRaw = pick(xml, 'vTPrest')
  let totalServiceAmount = null
  if (vTPrestRaw != null && vTPrestRaw !== '') {
    const v = parseFloat(String(vTPrestRaw).replace(',', '.'))
    totalServiceAmount = Number.isNaN(v) ? null : v
  }

  let amountToReceive = null
  const vRec = pick(xml, 'vRec')
  if (vRec != null && vRec !== '') {
    const v = parseFloat(String(vRec).replace(',', '.'))
    amountToReceive = Number.isNaN(v) ? null : v
  }

  const tomadorCpfCnpjDigits = extractTomadorDocument(xml, NS)
  const remetenteCpfCnpjDigits = extractRemetenteDocument(xml, NS)
  const destinatarioCpfCnpjDigits = extractDestinatarioDocument(xml, NS)
  const referencedNfeKeys = extractInfDocNfeKeys(xml, NS)

  const routeIbge = extractCteRouteIbgeMunicipalityCodes(xml)

  return {
    ctKey,
    ctNumber: Number.isNaN(ctNumber) ? null : ctNumber,
    ctSeries: Number.isNaN(ctSeries) ? null : ctSeries,
    ctCode: Number.isNaN(ctCode) ? null : ctCode,
    issuedAt,
    totalServiceAmount,
    amountToReceive,
    statusCode,
    reason,
    protocolNumber,
    description,
    cteTypeId: Number.isNaN(cteTypeId) ? null : cteTypeId,
    cfop,
    tomadorCpfCnpjDigits,
    remetenteCpfCnpjDigits,
    destinatarioCpfCnpjDigits,
    referencedNfeKeys,
    cMunIni: routeIbge.cMunIni,
    cMunFim: routeIbge.cMunFim,
    xml
  }
}

/**
 * Códigos IBGE de município de início e fim da prestação (`cMunIni` / `cMunFim`), com ou sem namespace.
 * @param {string|null|undefined} rawXml
 * @returns {{ cMunIni: string|null, cMunFim: string|null }}
 */
export function extractCteRouteIbgeMunicipalityCodes(rawXml) {
  const xml = String(rawXml || '').trim()
  if (!xml) return { cMunIni: null, cMunFim: null }

  const NS = '(?:[\\w.-]+:)?'
  const pick = (tag) => {
    const re = new RegExp(`<${NS}${tag}>([^<]*)</${NS}${tag}>`, 'i')
    const m = xml.match(re)
    const v = m ? m[1].trim() : ''
    if (!v) return null
    const digits = v.replace(/\D/g, '')
    return digits || null
  }

  return {
    cMunIni: pick('cMunIni'),
    cMunFim: pick('cMunFim')
  }
}

/**
 * Primeiro bloco `tag` no XML (ex.: rem, dest), com ou sem prefixo de namespace.
 * @param {string} xml
 * @param {string} NS
 * @param {string} tag
 * @returns {string|null}
 */
function extractPartyBlock(xml, NS, tag) {
  const m = xml.match(new RegExp(`<${NS}${tag}[^>]*>([\\s\\S]*?)<\\/${NS}${tag}>`, 'i'))
  return m ? m[1] : null
}

/**
 * CNPJ (14) ou CPF (11) só dígitos dentro de um bloco XML (ex.: `rem`, `toma3`).
 * @param {string|null|undefined} block
 * @param {string} NS
 * @returns {string|null}
 */
function extractPartyDocumentDigits(block, NS) {
  if (!block) return null
  const cnpj = block.match(new RegExp(`<${NS}CNPJ>\\s*(\\d{14})\\s*<\\/${NS}CNPJ>`, 'i'))
  if (cnpj) return cnpj[1]
  const cpf = block.match(new RegExp(`<${NS}CPF>\\s*(\\d{11})\\s*<\\/${NS}CPF>`, 'i'))
  if (cpf) return cpf[1]
  return null
}

/**
 * CNPJ/CPF do remetente da carga (`rem`), só dígitos.
 * @param {string} xml
 * @param {string} NS
 * @returns {string|null}
 */
function extractRemetenteDocument(xml, NS) {
  const rem = extractPartyBlock(xml, NS, 'rem')
  return extractPartyDocumentDigits(rem, NS)
}

/**
 * CNPJ/CPF do destinatário (`dest`), só dígitos — alinhado a `IDCliente` no legado.
 * @param {string} xml
 * @param {string} NS
 * @returns {string|null}
 */
function extractDestinatarioDocument(xml, NS) {
  const dest = extractPartyBlock(xml, NS, 'dest')
  return extractPartyDocumentDigits(dest, NS)
}

/**
 * @param {string} digits só dígitos (11 ou 14)
 * @returns {string}
 */
function formatBrazilianCpfCnpj(digits) {
  const d = String(digits || '').replace(/\D/g, '')
  if (d.length === 14) {
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
  }
  if (d.length === 11) {
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
  }
  return d
}

/**
 * xNome / xFant / documento formatado dentro de um bloco de parte (`rem`, `dest`, …).
 * @param {string|null|undefined} rawXml
 * @param {'rem'|'dest'} partyTag
 * @returns {string}
 */
function extractPartyDisplayFromXml(rawXml, partyTag) {
  const xml = String(rawXml || '').trim()
  if (!xml) return ''
  const hasCte = /<(?:[\w.-]+:)?CTe(?:\s|>)/i.test(xml) || /<(?:[\w.-]+:)?cteProc(?:\s|>)/i.test(xml)
  if (!hasCte) return ''

  const NS = '(?:[\\w.-]+:)?'
  const block = extractPartyBlock(xml, NS, partyTag)
  if (!block) return ''

  const pickInBlock = (tag) => {
    const re = new RegExp(`<${NS}${tag}>([^<]*)</${NS}${tag}>`, 'i')
    const m = block.match(re)
    return m ? m[1].trim() : ''
  }

  const xNome = pickInBlock('xNome')
  if (xNome) return xNome
  const xFant = pickInBlock('xFant')
  if (xFant) return xFant

  const digits = extractPartyDocumentDigits(block, NS)
  if (digits) return formatBrazilianCpfCnpj(digits)

  return ''
}

/**
 * Texto para exibição do remetente (`<rem>`).
 * @param {string|null|undefined} rawXml
 * @returns {string}
 */
export function extractRemetenteDisplayFromXml(rawXml) {
  return extractPartyDisplayFromXml(rawXml, 'rem')
}

/**
 * Texto para exibição do destinatário (`<dest>`).
 * @param {string|null|undefined} rawXml
 * @returns {string}
 */
export function extractDestinatarioDisplayFromXml(rawXml) {
  return extractPartyDisplayFromXml(rawXml, 'dest')
}

/**
 * CNPJ/CPF do tomador (quem paga o frete), só dígitos.
 * - `toma4`: documento informado no próprio grupo (terceiro).
 * - `toma3`: se houver CNPJ/CPF no grupo, usa; senão lê `<toma>N</toma>`:
 *   0=remetente (`rem`), 1=expedidor (`exped`), 2=recebedor (`receb`), 3=destinatário (`dest`).
 * @param {string} xml
 * @param {string} NS namespace prefix regex fragment
 * @returns {string|null}
 */
function extractTomadorDocument(xml, NS) {
  const m4 = xml.match(new RegExp(`<${NS}toma4[^>]*>([\\s\\S]*?)<\\/${NS}toma4>`, 'i'))
  const d4 = extractPartyDocumentDigits(m4 ? m4[1] : '', NS)
  if (d4) return d4

  const m3 = xml.match(new RegExp(`<${NS}toma3[^>]*>([\\s\\S]*?)<\\/${NS}toma3>`, 'i'))
  const inner3 = m3 ? m3[1] : ''
  const inline = extractPartyDocumentDigits(inner3, NS)
  if (inline) return inline

  const tomaMatch = inner3.match(new RegExp(`<${NS}toma>\\s*(\\d)\\s*<\\/${NS}toma>`, 'i'))
  const tomaCode = tomaMatch ? parseInt(tomaMatch[1], 10) : NaN
  const partyByCode = {
    0: 'rem',
    1: 'exped',
    2: 'receb',
    3: 'dest'
  }
  const partyTag = partyByCode[tomaCode]
  if (partyTag) {
    const partyBlock = extractPartyBlock(xml, NS, partyTag)
    const d = extractPartyDocumentDigits(partyBlock || '', NS)
    if (d) return d
  }

  return null
}

/**
 * Chaves de NF-e (44 dígitos) em `infDoc` / `infNFe` / `chave`.
 * @param {string} xml
 * @param {string} NS
 * @returns {string[]}
 */
export function extractInfDocNfeKeys(xml, NS) {
  const infDocMatch = xml.match(new RegExp(`<${NS}infDoc[^>]*>([\\s\\S]*?)<\\/${NS}infDoc>`, 'i'))
  const block = infDocMatch ? infDocMatch[1] : ''
  if (!block) return []
  const keys = []
  const re = new RegExp(`<${NS}chave>\\s*(\\d{44})\\s*<\\/${NS}chave>`, 'gi')
  let m
  while ((m = re.exec(block)) !== null) {
    keys.push(m[1])
  }
  return [...new Set(keys)]
}
