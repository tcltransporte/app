import { NextResponse } from 'next/server'
import { swaggerSpec } from '@/libs/swagger'

export async function GET() {
  return NextResponse.json(swaggerSpec)
}