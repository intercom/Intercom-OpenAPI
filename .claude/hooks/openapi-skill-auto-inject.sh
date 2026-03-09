#!/bin/bash
# UserPromptSubmit hook that auto-injects generate-openapi-from-pr skill instruction
# when user provides an intercom/intercom PR URL or asks to generate OpenAPI docs from a PR

# Read hook event data from stdin
hook_data=$(cat)

# Extract user message from the JSON
user_message=$(echo "$hook_data" | jq -r '.prompt // empty' 2>/dev/null)

# Check if user message contains intercom PR references or OpenAPI generation keywords
if echo "$user_message" | grep -qiE 'intercom/intercom(/pull/|#)[0-9]+|generate.*(openapi|open-api|spec).*(from|pr)|openapi.*(from|pr)|document.*(this|api).*(pr|change)'; then
    cat <<'EOF'
{
  "hookSpecificOutput": {
    "hookEventName": "UserPromptSubmit",
    "additionalContext": "OPENAPI: The user wants to generate OpenAPI spec changes from an intercom PR. Use the generate-openapi-from-pr skill to handle this request."
  }
}
EOF
else
    # No match - no additional context
    exit 0
fi
