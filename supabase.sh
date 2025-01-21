#!/bin/bash

case "$1" in
    "reset")
        echo "Resetting database..."
        npx supabase db reset
        ;;
    "push")
        echo "Pushing changes to production..."
        npx supabase db push
        ;;
    "types")
        echo "Generating TypeScript types..."
        rm -f src/lib/database.types.ts
        npx supabase gen types typescript --local > src/lib/database.types.ts
        ;;
    *)
        echo "Usage: ./supabase.sh [reset|push|types]"
        exit 1
        ;;
esac 