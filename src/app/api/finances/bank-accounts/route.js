import * as bankAccountAction from "@/app/actions/bankAccount.action"
import { NextResponse } from "next/server"

export async function GET() {
  const result = await bankAccountAction.findAll()
  return NextResponse.json(result.body, { status: result.header.status })
}

