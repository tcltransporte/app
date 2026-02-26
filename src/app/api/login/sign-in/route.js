// src/app/api/v1/auth/login/route.js
import * as loginService from "@/app/controllers/login.controller";
import { handleApiError } from "@/libs/errors/error-response";
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
 *             required: [username, password]
 *             properties:
 *               username:
 *                 type: string
 *                 example: "guilherme.venancio"
 *               password:
 *                 type: string
 *                 example: "@Rped94ft"
 *     responses:
 *       200:
 *         description: Token gerado
 *       401:
 *         description: Não autorizado (credenciais inválida)
 *       500:
 *         description: Erro interno do servidor
 */
export async function POST(request) {
  try {

    const { username, password } = await request.json()

    const response = await loginService.signIn({ username, password })

    return NextResponse.json(response)

  } catch (error) {

    return handleApiError(error)

  }
}