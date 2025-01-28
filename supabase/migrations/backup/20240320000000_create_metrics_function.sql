CREATE OR REPLACE FUNCTION get_average_metrics(
    p_ticket_id UUID,
    p_type TEXT,
    p_timeframe TEXT DEFAULT '24 hours'
)
RETURNS TABLE (
    avg_score FLOAT,
    count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        AVG(score)::FLOAT as avg_score,
        COUNT(*)::BIGINT as count
    FROM ai_metrics
    WHERE 
        ticket_id = p_ticket_id
        AND type = p_type
        AND created_at >= NOW() - p_timeframe::INTERVAL;
END;
$$ LANGUAGE plpgsql; 