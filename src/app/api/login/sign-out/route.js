// src/app/api/v1/auth/login/route.js
import * as loginService from "@/app/services/login.service";
import { ServiceResponse } from "@/libs/service";

/**
 * @swagger
 * /api/login/sign-out:
 *   post:
 *     summary: Invalidar token
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: JWT invalidado
 *       500:
 *         description: Detalhes do erro
 */
export async function POST() {

  const loginResult = await loginService.signOut()

  return ServiceResponse.json(loginResult)

}