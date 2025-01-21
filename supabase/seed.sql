-- First create users in auth.users with all required fields
INSERT INTO auth.users (
    id,
    email,
    raw_user_meta_data,
    raw_app_meta_data,
    created_at,
    updated_at,
    aud,
    role,
    instance_id,
    email_confirmed_at,
    encrypted_password,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    last_sign_in_at,
    is_sso_user,
    deleted_at
)
VALUES
  (
    'd0d4dc14-7c31-4c26-87fa-31e0c0f40c91',
    'admin@example.com',
    jsonb_build_object(
        'full_name', 'Admin User'
    ),
    jsonb_build_object('role', 'admin'),
    now(),
    now(),
    'authenticated',
    'authenticated',
    '00000000-0000-0000-0000-000000000000',
    now(),
    crypt('admin123', gen_salt('bf')),
    encode(gen_random_bytes(32), 'hex'),
    encode(gen_random_bytes(32), 'hex'),
    encode(gen_random_bytes(32), 'hex'),
    'admin@example.com',
    now(),
    FALSE,
    NULL
  ),
  (
    'e16c304f-87f9-4d4c-a5c8-26a551a4c425',
    'user@example.com',
    jsonb_build_object(
        'full_name', 'Regular User'
    ),
    jsonb_build_object('role', 'user'),
    now(),
    now(),
    'authenticated',
    'authenticated',
    '00000000-0000-0000-0000-000000000000',
    now(),
    crypt('user123', gen_salt('bf')),
    encode(gen_random_bytes(32), 'hex'),
    encode(gen_random_bytes(32), 'hex'),
    encode(gen_random_bytes(32), 'hex'),
    'user@example.com',
    now(),
    FALSE,
    NULL
  );

-- Create identities for the users
INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
)
VALUES
  (
    'd0d4dc14-7c31-4c26-87fa-31e0c0f40c91',
    'd0d4dc14-7c31-4c26-87fa-31e0c0f40c91',
    jsonb_build_object(
        'sub', 'd0d4dc14-7c31-4c26-87fa-31e0c0f40c91',
        'email', 'admin@example.com',
        'email_verified', true
    ),
    'email',
    'admin@example.com',
    now(),
    now(),
    now()
  ),
  (
    'e16c304f-87f9-4d4c-a5c8-26a551a4c425',
    'e16c304f-87f9-4d4c-a5c8-26a551a4c425',
    jsonb_build_object(
        'sub', 'e16c304f-87f9-4d4c-a5c8-26a551a4c425',
        'email', 'user@example.com',
        'email_verified', true
    ),
    'email',
    'user@example.com',
    now(),
    now(),
    now()
  );

-- Then create profiles for the users
INSERT INTO public.profiles (id, full_name, role)
VALUES
  ('d0d4dc14-7c31-4c26-87fa-31e0c0f40c91', 'Admin User', 'admin'),
  ('e16c304f-87f9-4d4c-a5c8-26a551a4c425', 'Regular User', 'user');

-- Seed data for customers
INSERT INTO public.customers (id, name, email, phone, company, status)
VALUES
  ('f0742c9b-9d18-4b2e-940e-ac43ad89b6b6', 'John Smith', 'john.smith@example.com', '+1-555-0123', 'Tech Corp', 'active'),
  ('748d9f7d-7e75-4acd-9302-dddf597b3acb', 'Jane Doe', 'jane.doe@example.com', '+1-555-0124', 'Design Co', 'active'),
  ('3d53bd74-c4c3-4147-a825-c3d4fae485e7', 'Bob Johnson', 'bob.j@example.com', '+1-555-0125', 'Marketing Inc', 'inactive');

-- Seed data for interactions
INSERT INTO public.interactions (customer_id, user_id, type, content, metadata)
VALUES
  ('f0742c9b-9d18-4b2e-940e-ac43ad89b6b6', 'd0d4dc14-7c31-4c26-87fa-31e0c0f40c91', 'email', 'Initial contact regarding services', '{"source": "email", "status": "completed"}'),
  ('f0742c9b-9d18-4b2e-940e-ac43ad89b6b6', 'd0d4dc14-7c31-4c26-87fa-31e0c0f40c91', 'call', 'Follow-up call about proposal', '{"duration": "15min", "outcome": "positive"}'),
  ('748d9f7d-7e75-4acd-9302-dddf597b3acb', 'e16c304f-87f9-4d4c-a5c8-26a551a4c425', 'meeting', 'Product demo meeting', '{"location": "virtual", "duration": "30min"}'),
  ('3d53bd74-c4c3-4147-a825-c3d4fae485e7', 'e16c304f-87f9-4d4c-a5c8-26a551a4c425', 'email', 'Service renewal discussion', '{"source": "email", "status": "pending"}');

-- Note: The user IDs in the profiles table should match real users created in auth.users
-- You'll need to create these users through Supabase authentication first
-- and then use their IDs in this seed file
UPDATE auth.users
SET email_confirmed_at = CURRENT_TIMESTAMP
WHERE email IN ('admin@example.com', 'user@example.com');

-- Add this after all inserts to force metadata sync
DO $$
BEGIN
  -- Force trigger execution for all profiles
  UPDATE public.profiles 
  SET updated_at = NOW()
  WHERE id IN (
    'd0d4dc14-7c31-4c26-87fa-31e0c0f40c91',
    'e16c304f-87f9-4d4c-a5c8-26a551a4c425'
  );
END $$;