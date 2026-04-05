import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import type { Request } from 'express'

export type JwtUserPayload = {
  sub: string
  email: string
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>()
    const auth = req.headers.authorization
    if (!auth?.startsWith('Bearer ')) {
      throw new UnauthorizedException({
        error: {
          code: 'UNAUTHORIZED',
          message: 'É necessário um token Bearer válido.',
        },
      })
    }
    const token = auth.slice(7)
    try {
      const payload = this.jwt.verify<JwtUserPayload>(token)
      ;(req as Request & { user: JwtUserPayload }).user = payload
      return true
    } catch {
      throw new UnauthorizedException({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Token inválido ou expirado.',
        },
      })
    }
  }
}
