import { NextResponse } from 'next/server'
import { AppError } from '@/libs/errors/app-error'

export class ErrorResponse {

  static json(error) {

    if (error instanceof AppError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.statusCode }
      )
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }

}