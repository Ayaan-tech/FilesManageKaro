import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher(["/", "/sign-up(.*)", "/sign-in(.*)", "/api(.*)"])
const isOnboardingRoute = createRouteMatcher(['/onboarding(.*)'])
const isAdminRoute = createRouteMatcher(['/admin(.*)'])

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims, redirectToSignIn } = await auth()
  const role = sessionClaims?.metadata?.role
  const pathname = req.nextUrl.pathname
  
  // Allow public routes (landing page, sign-in, sign-up, api)
  if (isPublicRoute(req)) {
    // If user is logged in and on landing page, redirect based on role
    if (userId && pathname === '/') {
      if (role === 'admin') {
        return NextResponse.redirect(new URL('/admin', req.url))
      } else {
        return NextResponse.redirect(new URL('/onboarding', req.url))
      }
    }
    return NextResponse.next()
  }
  
  // Redirect unauthenticated users to sign-in
  if (!userId) return redirectToSignIn({ returnBackUrl: req.url })
  
  // Admin route protection - only admins can access /admin
  if (isAdminRoute(req) && role !== 'admin') {
    return NextResponse.redirect(new URL('/onboarding', req.url))
  }
  
  // Regular users trying to access admin routes get redirected to onboarding
  // Admins trying to access onboarding get redirected to admin
  if (isOnboardingRoute(req) && role === 'admin') {
    return NextResponse.redirect(new URL('/admin', req.url))
  }
  
  return NextResponse.next()
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
