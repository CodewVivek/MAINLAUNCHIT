// Utility functions for creating Supabase clients in different contexts

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

/**
 * Create a Supabase client for Server Components
 * Use this in server components and server actions
 */
export async function createServerSupabaseClient() {
    // Next.js 16 cookies() is async in App Router.
    // If you don't await it, cookieStore is a Promise -> cookieStore.get is not a function.
    const cookieStore = await cookies()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                get(name) {
                    return cookieStore.get(name)?.value
                },
                set(name, value, options) {
                    try {
                        cookieStore.set({ name, value, ...options })
                    } catch {
                        // Server Components can be read-only for cookies; ignore.
                    }
                },
                remove(name, options) {
                    try {
                        cookieStore.set({ name, value: '', ...options })
                    } catch {
                        // Ignore
                    }
                },
            },
        }
    )
}

/**
 * Create a Supabase client for Route Handlers
 * Use this in API routes
 */
export async function createRouteHandlerClient() {
    const cookieStore = await cookies()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                get(name) {
                    return cookieStore.get(name)?.value
                },
                set(name, value, options) {
                    try {
                        cookieStore.set({ name, value, ...options })
                    } catch {
                        // Ignored
                    }
                },
                remove(name, options) {
                    try {
                        cookieStore.set({ name, value: '', ...options })
                    } catch {
                        // Ignored
                    }
                },
            },
        }
    )
}

/**
 * Create a Supabase client for build-time / non-request contexts.
 * Use this in generateStaticParams, sitemap, etc. where `cookies()` is not available.
 */
export function createPublicSupabaseClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
                detectSessionInUrl: false,
            },
        }
    )
}
