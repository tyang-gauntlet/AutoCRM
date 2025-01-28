-- Seed data for customers
INSERT INTO public.customers (id, name, email, phone, company, status, metadata)
VALUES
  (
    'f0742c9b-9d18-4b2e-940e-ac43ad89b6b6',
    'John Smith',
    'john.smith@example.com',
    '+1-555-0123',
    'Tech Corp',
    'active',
    jsonb_build_object('industry', 'technology', 'size', 'enterprise')
  ),
  (
    '748d9f7d-7e75-4acd-9302-dddf597b3acb',
    'Jane Doe',
    'jane.doe@example.com',
    '+1-555-0124',
    'Design Co',
    'active',
    jsonb_build_object('industry', 'design', 'size', 'small')
  ),
  (
    '3d53bd74-c4c3-4147-a825-c3d4fae485e7',
    'Bob Johnson',
    'bob.j@example.com',
    '+1-555-0125',
    'Marketing Inc',
    'inactive',
    jsonb_build_object('industry', 'marketing', 'size', 'medium')
  ); 