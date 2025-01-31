#!/bin/bash

# Get the access token from supabase CLI
get_access_token() {
    supabase token
}

case "$1" in
    "reset")
        echo "Resetting database..."
        npx supabase db reset --debug
        echo "Generating TypeScript types..."
        rm -f src/types/database.ts
        npx supabase gen types typescript --local > src/types/database.ts
        ;;
    "push")
        echo "Pushing changes to production..."
        npx supabase db push
        ;;
    "serve")
        case "$2" in
            "chat")
                echo "Starting chat function..."
                npx supabase functions serve chat --env-file ./supabase/functions/chat/.env --no-verify-jwt --import-map ./supabase/functions/chat/import_map.json
                ;;
            "embeddings")
                echo "Starting embeddings function..."
                npx supabase functions serve generate-embeddings --env-file ./supabase/functions/chat/.env --no-verify-jwt --import-map ./supabase/functions/generate-embeddings/import_map.json
                ;;
            *)
                echo "Usage: ./supabase.sh serve [chat|embeddings]"
                exit 1
                ;;
        esac
        ;;
    "embeddings")
        echo "Generating embeddings..."
        curl -i --request POST 'http://localhost:54321/functions/v1/generate-embeddings'
        ;;
    "remote-embeddings")
        echo "Triggering remote embeddings..."
        
        # Check for required environment variables
        if [ -z "$SUPABASE_URL" ]; then
            echo "Error: SUPABASE_URL environment variable is not set"
            echo "Please set it to your Supabase project URL (e.g., https://your-project.supabase.co)"
            exit 1
        fi
        
        if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
            echo "Error: SUPABASE_SERVICE_ROLE_KEY environment variable is not set"
            echo "Please set it to your service role key from the Supabase dashboard"
            exit 1
        fi
        
        # Remove any trailing slashes from URL
        SUPABASE_URL=${SUPABASE_URL%/}
        
        echo "Using Supabase URL: $SUPABASE_URL"
        
        # Make the request
        curl -i -X POST \
            -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
            -H "Content-Type: application/json" \
            "${SUPABASE_URL}/functions/v1/generate-embeddings"
        ;;
    *)
        echo "Usage: ./supabase.sh [reset|push|serve|embeddings|remote-embeddings]"
        echo "  reset               - Reset database and regenerate types"
        echo "  push               - Push changes to production"
        echo "  serve chat         - Start chat function"
        echo "  serve embeddings   - Start embeddings function"
        echo "  embeddings         - Generate embeddings locally"
        echo "  remote-embeddings  - Generate embeddings on remote function"
        exit 1
        ;;
esac 