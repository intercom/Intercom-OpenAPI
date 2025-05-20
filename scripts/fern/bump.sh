#!/bin/bash
#
# Bumps the version of the SDK by comparing the current API
# against a snapshot of the API from a previous commit.
#
# Usage:
#
# $ ./scripts/bump.sh --from HEAD~1 --group ts-sdk
set -uo pipefail

# The previous commit to compare against.
FROM_COMMIT=""

# The group to use for version detection
GROUP=""

log() {
    # Logs are written to stderr.
    echo "$@" >&2
}

usage() {
    echo "Usage: $0 --from <commit> --group <group>"
    echo "  --from           Previous commit reference (e.g., HEAD~1, 8475a09)"
    echo "  --group          Group to use for version detection (e.g., ts-sdk, java-sdk)"
    exit 1
}

fern() {
    # Use the version of the fern CLI installed in the user's environment.
    FERN_NO_VERSION_REDIRECTION=true command fern "$@"
}

get_latest_version() {
    local group=$1
    local version=""

    case $group in
        ts-sdk)
            # Get latest version from npm
            version=$(npm view intercom-client version 2>/dev/null)
            ;;
        java-sdk)
            # Get latest version from maven
            version=$(curl -s "https://repo1.maven.org/maven2/io/intercom/intercom-java/maven-metadata.xml" | grep -oP '<version>\K[^<]+' | sort -V | tail -n1)
            ;;
        *)
            log "Unknown group: $group"
            exit 1
            ;;
    esac

    if [[ -z "$version" ]]; then
        log "Could not determine latest version for group $group"
        exit 1
    fi

    echo "$version"
}

while [[ $# -gt 0 ]]; do
    case $1 in
        --from)
            FROM_COMMIT="$2"
            shift 2
            ;;
        --group)
            GROUP="$2"
            shift 2
            ;;
        -h|--help)
            usage
            ;;
        *)
            echo "Unknown option: $1"
            usage
            ;;
    esac
done

if [[ -z "$FROM_COMMIT" || -z "$GROUP" ]]; then
    usage
fi

# Get the latest version from the registry
FROM_VERSION=$(get_latest_version "$GROUP")
log "Using current version: $FROM_VERSION"

cleanup() {
    # Remove the temporary worktree, if any.
    if [[ -n "${WORKTREE_DIR:-}" ]] && [[ -d "$WORKTREE_DIR" ]]; then
        (cd "$WORKTREE_DIR" && git submodule deinit --all --force >/dev/null 2>&1 || true)
        git worktree remove --force "$WORKTREE_DIR" >/dev/null 2>&1 || true
    fi

    # Remove the from.json and to.json files, if any.
    rm -f "$WORK_DIR/from.json" "$WORK_DIR/to.json" >/dev/null 2>&1

    # Pop back to the user's original directory.
    popd >/dev/null 2>&1
}

trap cleanup EXIT

# Step 0: Navigate to the fern root directory, if not already.
WORK_DIR="$(git rev-parse --show-toplevel)"
pushd "$WORK_DIR" >/dev/null 2>&1

# Step 1: Generate IR from current commit.
log "Generating IR from current commit..."
fern ir to.json

# Step 2: Create worktree and generate IR from previous commit.
WORKTREE_DIR=$(mktemp -d)
log "Generating IR from previous commit..."
git worktree add "$WORKTREE_DIR" "$FROM_COMMIT" >/dev/null 2>&1
(
    cd "$WORKTREE_DIR" || {
        log "Cannot access worktree directory"
        exit 1
    }

    # Initialize and update git submodules, if any.
    git submodule update --init --recursive >/dev/null 2>&1

    fern ir from.json
)

# Step 3: Copy the from.json to the current working directory
cp "$WORKTREE_DIR/from.json" "$WORK_DIR/from.json"

# Step 4: Run fern diff.
log "Running fern diff..."
DIFF_OUTPUT=$(fern diff --from from.json --to to.json --from-version "$FROM_VERSION")

# Debug: Print the full diff output
log "Diff output: $DIFF_OUTPUT"

# Step 5: Extract next version using jq.
NEXT_VERSION=$(echo "$DIFF_OUTPUT" | jq -r '.nextVersion')

if [[ -z "$NEXT_VERSION" ]]; then
    log "Could not determine next version from 'fern diff' output: $DIFF_OUTPUT"
    exit 1
fi

echo "$NEXT_VERSION"
