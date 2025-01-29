#!/bin/bash

# Default values
URL="http://localhost:54321/functions/v1/chat"
MESSAGE="Hello, how can you help me?"
TICKET_ID="optional-ticket-id"
TRACE_ID="optional-trace-id"

# Function to print usage
print_usage() {
    echo "Usage: $0 [-m message] [-t ticket_id] [-r trace_id]"
    echo "  -m    Message to send (default: 'Hello, how can you help me?')"
    echo "  -t    Ticket ID (default: 'optional-ticket-id')"
    echo "  -r    Trace ID (default: 'optional-trace-id')"
    echo "  -h    Show this help message"
}

# Parse command line options
while getopts "m:t:r:h" opt; do
    case $opt in
        m) MESSAGE="$OPTARG";;
        t) TICKET_ID="$OPTARG";;
        r) TRACE_ID="$OPTARG";;
        h) print_usage; exit 0;;
        ?) print_usage; exit 1;;
    esac
done

# Prepare JSON data
JSON_DATA=$(cat <<EOF
{
    "message": "$MESSAGE",
    "ticketId": "$TICKET_ID",
    "traceId": "$TRACE_ID"
}
EOF
)

# Make the curl request
echo "Sending request to $URL..."
echo "Payload: $JSON_DATA"
echo "---"

curl -i --request POST "$URL" \
    --header 'Content-Type: application/json' \
    --data "$JSON_DATA"

echo -e "\n---" 