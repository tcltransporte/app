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
 *         name: search
 *         schema:
 *           type: string
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
  const search = searchParams.get('search') || ''

  const result = await partnerService.findAll({ page, limit, search })

  const { status, ...body } = result

  return NextResponse.json(body, { status })

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

  const result = await partnerService.create(data)

  const { status, ...body } = result

  return NextResponse.json(body, { status })

}
