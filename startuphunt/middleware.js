import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

const MAINTENANCE_ALLOWED_EMAIL = 'skypher206@gmail.com'

export async function middleware(request) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value)
                        response.cookies.set(name, value, options)
                    })
                },
            },
        }
    )

    // IMPORTANT: Use getUser() instead of getSession()
    // This refreshes the auth token and validates it against the DB
    const { data: { user }, error } = await supabase.auth.getUser()

    // Maintenance mode: only admin + skypher206@gmail.com get full access
    // Read from both server-only and NEXT_PUBLIC env to be safe on all hosts.
    const maintenanceEnv = process.env.MAINTENANCE_MODE ?? process.env.NEXT_PUBLIC_MAINTENANCE_MODE
    const maintenanceMode = maintenanceEnv === 'true' || maintenanceEnv === '1'
    if (maintenanceMode) {
        const path = request.nextUrl.pathname
        if (path === '/maintenance' || path.startsWith('/api/')) {
            return response
        }
        if (!user) {
            if (path === '/register' || path === '/UserRegister') {
                return response
            }
            const url = request.nextUrl.clone()
            url.pathname = '/maintenance'
            return NextResponse.redirect(url)
        }
        const isAllowedEmail = user.email?.toLowerCase() === MAINTENANCE_ALLOWED_EMAIL.toLowerCase()
        if (isAllowedEmail) {
            return response
        }
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
        if (profile?.role === 'admin') {
            return response
        }
        const url = request.nextUrl.clone()
        url.pathname = '/maintenance'
        return NextResponse.redirect(url)
    }

    // Protected routes logic (must be logged in)
    const protectedRoutes = [
        '/submit', '/settings', '/saved', '/pitch-upload',
        '/my-launches', '/saved-projects', '/upvoted-projects', '/viewed-history',
        '/dashboard', '/admin', '/feedback', '/customer-portal'
    ]
    const isProtectedRoute = protectedRoutes.some(route =>
        request.nextUrl.pathname.startsWith(route)
    )
    const isProfileMe = request.nextUrl.pathname === '/profile/me' || request.nextUrl.pathname.startsWith('/profile/me?')
    if (isProfileMe && !user) {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = '/register'
        redirectUrl.searchParams.set('redirected', 'true')
        redirectUrl.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search)
        return NextResponse.redirect(redirectUrl)
    }

    // Redirect to login if accessing protected route without a valid user
    if (isProtectedRoute && !user) {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = '/register' // Changed from '/' to '/register' for clarity
        redirectUrl.searchParams.set('redirected', 'true')
        // Add the original URL so we can redirect back after login
        redirectUrl.searchParams.set('next', request.nextUrl.pathname)
        return NextResponse.redirect(redirectUrl)
    }

    return response
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
