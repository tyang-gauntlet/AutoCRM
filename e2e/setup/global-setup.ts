import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

const TEST_USER_EMAIL = 'test@example.com'

// Helper function to wait
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

async function globalSetup() {
    // Load test environment variables
    dotenv.config({
        path: path.resolve(process.cwd(), '.env.test')
    })

    // Verify environment variables are loaded
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error(
            'Required environment variables are missing. Please check .env.test file:\n' +
            '- NEXT_PUBLIC_SUPABASE_URL\n' +
            '- SUPABASE_SERVICE_ROLE_KEY'
        )
    }

    // Instead of directly assigning NODE_ENV, use cross-env in package.json
    // or set it before running the tests
    if (process.env.NODE_ENV !== 'test') {
        console.warn('Warning: NODE_ENV is not set to "test"')
    }

    try {
        // Create Supabase admin client
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        console.log('🔍 Looking for existing test user...')
        // First, try to find existing user through auth API
        const { data: { users }, error: getUserError } = await supabaseAdmin.auth.admin.listUsers()
        const existingUser = users?.find(u => u.email === TEST_USER_EMAIL)

        if (getUserError) {
            console.error('Error looking up user:', getUserError)
            throw getUserError
        }

        // If user exists, delete it
        if (existingUser?.id) {
            console.log('🗑️ Removing existing test user...')
            await supabaseAdmin.auth.admin.deleteUser(existingUser.id)
            // Wait a bit for deletion to propagate
            await wait(2000)
        }

        console.log('👤 Creating test user...')
        // Create test users with admin privileges
        const { data, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: TEST_USER_EMAIL,
            password: 'testpassword123',
            email_confirm: true
        })

        if (createError || !data.user) {
            console.error('Error creating test user:', createError)
            throw createError || new Error('User creation failed')
        }

        // Wait for user creation to propagate
        await wait(1000)

        console.log('🔑 Setting up user permissions...')
        // Set security context for RLS
        await supabaseAdmin.auth.admin.updateUserById(data.user.id, {
            app_metadata: {
                role: 'admin'
            }
        })

        // Wait for permissions to propagate
        await wait(1000)

        // Explicitly set RLS bypass for test user
        await supabaseAdmin.rpc('set_claim', {
            uid: data.user.id,
            claim: 'bypass_rls',
            value: true
        })

        console.log('✅ Test setup completed successfully')
    } catch (error) {
        console.error('❌ Test setup failed:', error)
        throw error
    }
}

export default globalSetup 