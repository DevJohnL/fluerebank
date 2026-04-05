import {
  type ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import type { Response } from 'express'

/**
 * Formato de erro alinhado ao checklist do projeto: `{ error: { code, message } }`.
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const res = ctx.getResponse<Response>()
    const status = exception.getStatus()
    const body = exception.getResponse()

    if (typeof body === 'object' && body !== null && 'error' in body) {
      const err = (body as { error: unknown }).error
      if (typeof err === 'object' && err !== null && 'message' in err) {
        res.status(status).json(body)
        return
      }
    }

    const message =
      typeof body === 'string'
        ? body
        : (() => {
            const o = body as Record<string, unknown>
            const m = o.message
            if (Array.isArray(m)) return m.filter((x): x is string => typeof x === 'string').join(', ')
            if (typeof m === 'string') return m
            return exception.message
          })()

    const code =
      status === HttpStatus.BAD_REQUEST
        ? 'BAD_REQUEST'
        : status === HttpStatus.UNAUTHORIZED
          ? 'UNAUTHORIZED'
          : status === HttpStatus.NOT_FOUND
            ? 'NOT_FOUND'
            : 'HTTP_ERROR'

    res.status(status).json({
      error: {
        code,
        message,
      },
    })
  }
}
