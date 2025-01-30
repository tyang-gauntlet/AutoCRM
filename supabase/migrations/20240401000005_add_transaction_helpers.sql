-- Add transaction helper functions for embedding generation
CREATE OR REPLACE FUNCTION begin_transaction()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Start a new transaction block
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_stat_activity 
        WHERE pid = pg_backend_pid() 
        AND state LIKE '%transaction%'
    ) THEN
        PERFORM set_config('my.in_transaction', 'true', true);
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION commit_transaction()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only attempt commit if we started the transaction
    IF current_setting('my.in_transaction', true) = 'true' THEN
        COMMIT;
        PERFORM set_config('my.in_transaction', 'false', true);
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- Reset the transaction state
        PERFORM set_config('my.in_transaction', 'false', true);
        RAISE;
END;
$$;

CREATE OR REPLACE FUNCTION rollback_transaction()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only attempt rollback if we started the transaction
    IF current_setting('my.in_transaction', true) = 'true' THEN
        ROLLBACK;
        PERFORM set_config('my.in_transaction', 'false', true);
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- Reset the transaction state
        PERFORM set_config('my.in_transaction', 'false', true);
        RAISE;
END;
$$;

-- Grant access to the edge function role
GRANT EXECUTE ON FUNCTION begin_transaction() TO service_role;
GRANT EXECUTE ON FUNCTION commit_transaction() TO service_role;
GRANT EXECUTE ON FUNCTION rollback_transaction() TO service_role; 