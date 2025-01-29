-- Insert initial categories
INSERT INTO public.kb_categories (name, slug, description)
VALUES
    ('Getting Started', 'getting-started', 'Basic introduction and setup guides'),
    ('Features', 'features', 'Detailed feature documentation'),
    ('Troubleshooting', 'troubleshooting', 'Common issues and solutions'),
    ('Best Practices', 'best-practices', 'Recommended usage and tips'),
    ('API Documentation', 'api', 'API reference and examples'),
    ('Security', 'security', 'Security guidelines and practices'),
    ('Updates', 'updates', 'Product updates and changelogs')
ON CONFLICT (slug) DO UPDATE
SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description; 