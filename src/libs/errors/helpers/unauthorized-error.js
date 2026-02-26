import { AppError } from '../app-error.js'

export class UnauthorizedError extends AppError {
  constructor(message = 'Token de autenticação não informado!') {
    super(message, 401)
  }
}