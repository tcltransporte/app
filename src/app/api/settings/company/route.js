import { NextResponse } from "next/server"
import * as companyService from "@/app/controllers/settings/company.controller"
import { ErrorResponse } from "@/libs/errors/error-response"

/**
 * @swagger
 * /api/settings/company:
 *   get:
 *     summary: Obter dados da empresa
 *     description: |
 *       Retorna as informações cadastrais da empresa associada ao usuário autenticado.
 *       Este endpoint requer autenticação via token JWT.
 *     tags:
 *       - Settings
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados da empresa
 *       401:
 *         description: Token inválido ou expirado!
 *       500:
 *         description: Erro interno do servidor
 */
export async function GET() {
  try {

    const response = await companyService.findOne()

    return NextResponse.json(response)

  } catch (error) {

    return ErrorResponse.json(error)

  }
}