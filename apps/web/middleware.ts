import createMiddleware from 'next-intl/middleware'

import { routing } from './i18n/routing'

export default createMiddleware(routing)

export const config = {
  matcher: [
    // Exclude static files, images, and routes that must not be localised (admin, api)
    '/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|admin|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
