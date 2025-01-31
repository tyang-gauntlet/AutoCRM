#!/bin/bash

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
        curl -L -X POST 'https://yzpdqvyistlnrcwequny.supabase.co/functions/v1/generate-embeddings' -H "Authorization: Bearer $SUPABASE_ANON_KEY" --data '{"name":"Functions"}'
        ;;
    *)
        echo "Usage: ./supabase.sh [reset|push|serve|generate-embeddings]"
        echo "  reset               - Reset database and regenerate types"
        echo "  push               - Push changes to production"
        echo "  serve chat         - Start chat function"
        echo "  serve embeddings   - Start embeddings function"
        echo "  generate-embeddings - Generate embeddings for knowledge base articles"
        exit 1
        ;;
esac 