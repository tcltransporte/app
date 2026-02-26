// src/app/api/v1/auth/login/route.js
import * as loginService from "@/app/controllers/login.controller";
import { NextResponse } from "next/server";

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
export async function POST(request) {
  try {

    await loginService.signOut()

    return NextResponse.json(result)

  } catch (error) {

    return NextResponse.json({message: error.message}, { status: 500 });

  }
}