#!/bin/bash

# Comment API Test Script
# This script tests the comment functionality to ensure it's working

API_BASE_URL="${API_BASE_URL:-http://localhost:3000/api/v1}"
AUTH_TOKEN="${AUTH_TOKEN:-}"
CONTENT_ID="${CONTENT_ID:-test-short-id}"
CONTENT_TYPE="${CONTENT_TYPE:-short}"

echo "====================================="
echo "Comment API Test Script"
echo "====================================="
echo "API Base URL: $API_BASE_URL"
echo "Content ID: $CONTENT_ID"
echo "Content Type: $CONTENT_TYPE"
echo ""

# Test 1: Health check for comments API
echo "Test 1: Testing comments API accessibility..."
curl -s "$API_BASE_URL/comments/test" | json_pp
echo ""

# Test 2: Get comments (no auth required)
echo "Test 2: Getting comments for content..."
curl -s "$API_BASE_URL/comments?contentType=$CONTENT_TYPE&contentId=$CONTENT_ID&sortBy=latest&limit=20" | json_pp
echo ""

# Test 3: Create comment (requires auth)
if [ -n "$AUTH_TOKEN" ]; then
    echo "Test 3: Creating a comment..."
    curl -X POST \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"text":"Test comment from script","parent_id":null,"replyToUserId":null}' \
        "$API_BASE_URL/comments?contentType=$CONTENT_TYPE&contentId=$CONTENT_ID" \
        | json_pp
    echo ""
else
    echo "Test 3: Skipped (no AUTH_TOKEN provided)"
    echo ""
fi

echo "====================================="
echo "Test Complete"
echo "====================================="
echo ""
echo "To run with authentication:"
echo "  export AUTH_TOKEN='your-jwt-token'"
echo "  export CONTENT_ID='actual-content-id'"
echo "  bash test-comments.sh"
