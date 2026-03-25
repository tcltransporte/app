import { NextResponse } from 'next/server'
import * as partnerService from "@/app/services/partner.service"

/**
 * @swagger
 * /api/partners:
 *   get:
 *     summary: Listar parceiros
 *     description: Retorna lista paginada de parceiros da empresa do usuário autenticado.
 *     tags:
 *       - Partners
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: filters
 *         schema:
 *           type: string
 *         description: Objeto JSON com filtros avançados
 *       - in: query
 *         name: range
 *         schema:
 *           type: string
 *         description: Objeto JSON com filtros de período
 *     responses:
 *       200:
 *         description: Lista de parceiros
 *       401:
 *         description: Token inválido ou expirado
 */
export async function GET(request) {

  const { searchParams } = new URL(request.url)

  const page = Number(searchParams.get('page')) || 1
  const limit = Number(searchParams.get('limit')) || 50

  // Parse filters and range from JSON strings
  let filters = {}
  let range = {}

  try {
    const filtersParam = searchParams.get('filters')
    if (filtersParam) filters = JSON.parse(filtersParam)

    const rangeParam = searchParams.get('range')
    if (rangeParam) range = JSON.parse(rangeParam)
  } catch (error) {
    console.error('Erro ao processar parâmetros da API:', error)
  }

  const partnerResult = await partnerService.findAll({ page, limit, filters, range })

  return NextResponse.json(partnerResult.body, { status: partnerResult.header.status })

}

/**
 * @swagger
 * /api/partners:
 *   post:
 *     summary: Criar parceiro
 *     description: Cria um novo parceiro na empresa do usuário autenticado.
 *     tags:
 *       - Partners
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Parceiro criado
 *       401:
 *         description: Token inválido ou expirado
 */
export async function POST(request) {

  const data = await request.json()

  const partnerResult = await partnerService.create(data)

  return NextResponse.json(partnerResult.body, { status: partnerResult.header.status })

}
