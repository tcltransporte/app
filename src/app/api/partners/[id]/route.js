import { NextResponse } from 'next/server'
import * as partnerService from "@/app/services/partner.service"

/**
 * @swagger
 * /api/partners/{id}:
 *   get:
 *     summary: Buscar parceiro por ID
 *     tags:
 *       - Partners
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Dados do parceiro
 *       400:
 *         description: Parceiro não encontrado
 */
export async function GET(request, { params }) {

  const { id } = await params

  const result = await partnerService.findOne(null, Number(id))

  const { status, ...body } = result

  return NextResponse.json(body, { status })

}

/**
 * @swagger
 * /api/partners/{id}:
 *   put:
 *     summary: Atualizar parceiro
 *     tags:
 *       - Partners
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Parceiro atualizado
 *       400:
 *         description: Parceiro não encontrado
 */
export async function PUT(request, { params }) {

  const { id } = await params
  const data = await request.json()

  const result = await partnerService.update(null, Number(id), data)

  const { status, ...body } = result

  return NextResponse.json(body, { status })

}

/**
 * @swagger
 * /api/partners/{id}:
 *   delete:
 *     summary: Excluir parceiro
 *     tags:
 *       - Partners
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Parceiro excluído
 *       400:
 *         description: Parceiro não encontrado
 */
export async function DELETE(request, { params }) {

  const { id } = await params

  const result = await partnerService.destroy(null, Number(id))

  const { status, ...body } = result

  return NextResponse.json(body, { status })

}
