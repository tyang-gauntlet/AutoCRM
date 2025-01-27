import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

async function globalSetup() {
    // Load test environment variables
    dotenv.config({ path: '.env.test' })

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    try {
        // First try to sign in
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: 'test@example.com',
            password: 'testPassword123!'
        })

        if (signInError) {
            // If sign in fails, create new user
            const { data: { user }, error: signUpError } = await supabase.auth.signUp({
                email: 'test@example.com',
                password: 'testPassword123!',
                options: {
                    data: { role: 'user' }
                }
            })

            if (signUpError && !signUpError.message.includes('already registered')) {
                console.error('Error creating test user:', signUpError)
                process.exit(1)
            }

            if (user) {
                // Create profile for the user
                const { error: profileError } = await supabase
                    .from('profiles')
                    .upsert({
                        id: user.id,
                        email: 'test@example.com',
                        role: 'user',
                        status: 'active'
                    })

                if (profileError) {
                    console.error('Error creating profile:', profileError)
                    process.exit(1)
                }

                console.log('Test user created successfully')
            }
        } else {
            console.log('Test user already exists')
        }
    } catch (error) {
        if (error instanceof Error && !error.message.includes('already registered')) {
            console.error('Error in global setup:', error)
            process.exit(1)
        }
        console.log('Test user already exists')
    }
}

export default globalSetup 