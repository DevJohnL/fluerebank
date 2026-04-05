import { createParamDecorator, type ExecutionContext } from '@nestjs/common'
import type { JwtUserPayload } from './jwt-auth.guard'

export const CurrentUser = createParamDecorator(
  (data: keyof JwtUserPayload | undefined, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest<{ user?: JwtUserPayload }>()
    const user = req.user
    if (!user) return undefined
    return data ? user[data] : user
  },
)
