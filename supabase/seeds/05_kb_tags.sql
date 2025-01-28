-- First, ensure we have all our tags
INSERT INTO public.kb_tags (name, description) 
VALUES
    ('getting-started', 'Basic introduction and setup guides'),
    ('troubleshooting', 'Common issues and their solutions'),
    ('api', 'API documentation and examples'),
    ('security', 'Security-related information'),
    ('deployment', 'Deployment guides and best practices'),
    ('configuration', 'Configuration and settings'),
    ('best-practices', 'Recommended approaches and patterns'),
    ('faq', 'Frequently asked questions'),
    ('features', 'Feature documentation and usage'),
    ('integrations', 'Third-party integration guides'),
    ('updates', 'Product updates and changelog'),
    ('tutorials', 'Step-by-step tutorials'),
    ('reference', 'Technical reference documentation'),
    ('architecture', 'System architecture documentation'),
    ('performance', 'Performance optimization guides')
ON CONFLICT (name) DO UPDATE
SET description = EXCLUDED.description; 