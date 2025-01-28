-- Seed knowledge base categories
INSERT INTO public.kb_categories (name, slug, description)
VALUES
  ('Getting Started', 'getting-started', 'Essential guides and tutorials to help you get up and running with AutoCRM. Perfect for new users.'),
  ('Account Management', 'account', 'Learn how to manage your account settings, security, and user preferences effectively.'),
  ('Troubleshooting', 'troubleshooting', 'Solutions to common issues, error messages, and technical problems you might encounter.'),
  ('Best Practices', 'best-practices', 'Expert tips, recommendations, and industry standards for optimal usage of AutoCRM.'),
  ('API Documentation', 'api', 'Comprehensive technical documentation for API integration, including examples and use cases.'),
  ('Security & Privacy', 'security', 'Important information about security features, data protection, and privacy settings.'),
  ('Integrations', 'integrations', 'Guides for connecting AutoCRM with other tools and services in your workflow.'); 