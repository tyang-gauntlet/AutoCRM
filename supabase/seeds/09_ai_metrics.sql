-- Seed AI metrics data
INSERT INTO public.ai_metrics (
    id,
    trace_id,
    ticket_id,
    type,
    score,
    metadata,
    created_at,
    created_by
)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'trace_kra_1',
    'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d',
    'kra',
    0.85,
    jsonb_build_object(
      'query_count', 3,
      'total_chunks', 12,
      'processing_time', '1.2s',
      'model', 'gpt-4'
    ),
    NOW() - INTERVAL '4 days',
    'f7c6d5e4-b3a2-4c91-8c7d-1a2b3c4d5e6f'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'trace_rgqs_1',
    'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d',
    'rgqs',
    0.92,
    jsonb_build_object(
      'response_length', 245,
      'sentiment', 'positive',
      'clarity_score', 0.88,
      'technical_accuracy', 0.95
    ),
    NOW() - INTERVAL '3 days',
    'f7c6d5e4-b3a2-4c91-8c7d-1a2b3c4d5e6f'
  );

-- Seed knowledge retrieval metrics
INSERT INTO public.knowledge_retrieval_metrics (
    id,
    metric_id,
    query_text,
    retrieved_chunks,
    relevant_chunks,
    accuracy,
    relevance_score,
    context_match,
    created_at
)
VALUES
  (
    'aaaaaaaa-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'How to reset password?',
    jsonb_build_array(
      jsonb_build_object(
        'content', 'Password reset process...',
        'article_id', 'b2c3d4e5-f6a7-4b5b-8c7d-9e0f1a2b3c4d',
        'similarity', 0.92
      )
    ),
    jsonb_build_array(
      jsonb_build_object(
        'content', 'Password reset process...',
        'article_id', 'b2c3d4e5-f6a7-4b5b-8c7d-9e0f1a2b3c4d',
        'is_relevant', true
      )
    ),
    0.90,
    0.85,
    0.80,
    NOW() - INTERVAL '4 days'
  );

-- Seed response quality metrics
INSERT INTO public.response_quality_metrics (
    id,
    metric_id,
    response_text,
    overall_quality,
    relevance,
    accuracy,
    tone,
    human_rating,
    created_at
)
VALUES
  (
    'cccccccc-3333-3333-3333-333333333333',
    '22222222-2222-2222-2222-222222222222',
    'Here are the steps to reset your password...',
    4.5,
    4.8,
    4.7,
    4.2,
    4.5,
    NOW() - INTERVAL '2 days'
  ); 