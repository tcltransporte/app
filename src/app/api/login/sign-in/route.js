import * as loginService from "@/app/services/login.service";
import { ServiceResponse } from "@/libs/service";
import { NextResponse } from "next/server";

/**
 * @swagger
 * /api/login/sign-in:
 *   post:
 *     summary: Login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password, companyBusinessId, companyId]
 *             properties:
 *               username:
 *                 type: string
 *                 example: "guilherme.venancio"
 *               password:
 *                 type: string
 *                 example: "@Rped94ft"
 *               companyBusinessId:
 *                 type: number
 *                 example: "1"
 *               companyId:
 *                 type: number
 *                 example: "1"
 *     responses:
 *       200:
 *         description: Token gerado
 *       400:
 *         description: Erro de validação na requisição (dados obrigatórios ausentes ou formato inválido)
 *       500:
 *         description: Erro interno do servidor
 */
export async function POST(request) {

  const { username, password, companyBusinessId, companyId } = await request.json()

  const loginResult = await loginService.signIn({ username, password, companyBusinessId, companyId })

  const { status, ...body } = loginResult

  return NextResponse.json(body, { status })

}