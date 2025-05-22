#!/bin/bash
#
# Bumps the version of the SDK by comparing the current API
# against a snapshot of the API from a previous commit.
#
# Usage:
#
# $ ./scripts/bump.sh --from HEAD~1 --group ts-sdk

set -uo pipefail

FROM_COMMIT=""
GROUP=""

log() {
    echo "$@" >&2
}

ensure_fern_cli() {
    if ! command -v fern &> /dev/null; then
        log "Installing Fern CLI..."
        if ! npm install -g fern-api@latest; then
            log "Failed to install Fern CLI"
            exit 1
        fi
    else
        log "Fern CLI is already installed"
    fi
}

usage() {
    echo "Usage: $0 --from <commit> --group <group>"
    echo "  --from           Previous commit reference (e.g., HEAD~1, 8475a09)"
    echo "  --group          Group to use for version detection (e.g., ts-sdk, java-sdk)"
    exit 1
}

fern() {
    FERN_NO_VERSION_REDIRECTION=true command fern "$@"
}

get_latest_version() {
    local group=$1
    local version=""

    case $group in
        ts-sdk)
            version=$(npm view intercom-client version 2>/dev/null)
            ;;
        java-sdk)
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

# Ensure Fern CLI is installed
ensure_fern_cli

# Get working directory and reset temp dir
WORK_DIR="$(git rev-parse --show-toplevel)"
WORKTREE_DIR="$WORK_DIR/.tmp_worktree"
rm -rf "$WORKTREE_DIR"

# Ensure the FROM_COMMIT exists
log "Verifying that commit $FROM_COMMIT exists..."
if ! git rev-parse "$FROM_COMMIT" &>/dev/null; then
    log "Commit $FROM_COMMIT not found. Did you fetch full history?"
    exit 1
fi

# Get the latest version
FROM_VERSION=$(get_latest_version "$GROUP")
log "Using current version: $FROM_VERSION"

# Ensure cleanup on exit
cleanup() {
    if [[ -d "$WORKTREE_DIR" ]]; then
        (cd "$WORKTREE_DIR" && git submodule deinit --all --force >/dev/null 2>&1 || true)
        git worktree remove --force "$WORKTREE_DIR" >/dev/null 2>&1 || true
    fi
    rm -f "$WORK_DIR/from.json" "$WORK_DIR/to.json" >/dev/null 2>&1
    popd >/dev/null 2>&1 || true
}
trap cleanup EXIT

# Navigate to project root
pushd "$WORK_DIR" >/dev/null

# Generate IR from current commit
log "Generating IR from current commit..."
fern ir to.json

# Generate IR from previous commit in worktree
log "Creating worktree in $WORKTREE_DIR..."
if ! git worktree add "$WORKTREE_DIR" "$FROM_COMMIT"; then
    log "Failed to create worktree"
    exit 1
fi

(
    cd "$WORKTREE_DIR" || {
        log "Cannot access worktree directory"
        exit 1
    }

    log "Updating submodules..."
    git submodule update --init --recursive

    log "Running fern ir for previous commit..."
    fern ir from.json

    if [ ! -f "from.json" ]; then
        log "from.json was not generated in worktree"
        exit 1
    fi
)

# Copy from.json back to root
log "Copying from.json to working directory..."
cp "$WORKTREE_DIR/from.json" "$WORK_DIR/from.json"

# Diff and get next version
log "Running fern diff..."
DIFF_OUTPUT=$(fern diff --from from.json --to to.json --from-version "$FROM_VERSION")
log "Diff output: $DIFF_OUTPUT"

NEXT_VERSION=$(echo "$DIFF_OUTPUT" | jq -r '.nextVersion')

if [[ -z "$NEXT_VERSION" || "$NEXT_VERSION" == "null" ]]; then
    log "Could not determine next version from fern diff output"
    exit 1
fi

echo "$NEXT_VERSION"
