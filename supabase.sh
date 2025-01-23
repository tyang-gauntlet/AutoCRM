#!/bin/bash

case "$1" in
    "reset")
        echo "Resetting database..."
        npx supabase db reset --debug
        ;;
    "push")
        echo "Pushing changes to production..."
        npx supabase db push
        ;;
    "types")
        echo "Generating TypeScript types..."
        rm -f src/types/database.ts
        npx supabase gen types typescript --local > src/types/database.ts
        ;;
    *)
        echo "Usage: ./supabase.sh [reset|push|types]"
        exit 1
        ;;
esac 