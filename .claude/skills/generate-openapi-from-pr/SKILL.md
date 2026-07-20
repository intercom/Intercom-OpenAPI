---
name: generate-openapi-from-pr
description: >
  Generate OpenAPI spec changes from an intercom monolith PR. Use this skill whenever a user
  provides an intercom/intercom PR URL or number, asks to generate or update OpenAPI docs,
  update the spec, document an API change, or mentions shipping API documentation from a PR.
  Also trigger when the user pastes a github.com/intercom/intercom/pull/ URL even without
  explicit instructions — they almost certainly want spec changes generated. This is the
  primary workflow for this repository.

metadata:
  author: team-data-foundations
  version: "1.0"
  user-invocable: true
  argument-hint: "<intercom-pr-url-or-number>"

allowed-tools: Task, Read, Glob, Grep, Write, Edit, Bash, AskUserQuestion
---

# Generate OpenAPI Spec from Intercom PR

This skill takes an intercom monolith PR (from `intercom/intercom`) and generates the corresponding OpenAPI spec changes in this repo (`Intercom-OpenAPI`).

## Workflow

### Step 1: Parse Input

Extract the PR number from the user's input. Accept:
- Full URL: `https://github.com/intercom/intercom/pull/12345`
- Short reference: `intercom/intercom#12345`
- Just a number: `12345` (assume intercom/intercom)

### Step 2: Fetch PR Details

```bash
# Get PR description, metadata, and state
gh pr view <NUMBER> --repo intercom/intercom --json title,body,files,labels,state

# Get the full diff (works for open and merged PRs)
gh pr diff <NUMBER> --repo intercom/intercom
```

If the diff is too large, fetch individual changed files instead:
```bash
gh pr view <NUMBER> --repo intercom/intercom --json files --jq '.files[].path'
```

Then fetch specific files of interest (controllers, models, version changes, routes).

For merged PRs where you need the full file (not just diff), fetch from the default branch:
```bash
gh api repos/intercom/intercom/contents/<path> --jq '.content' | base64 -d
```

### Step 3: Analyze the Diff

Scan the diff for these file patterns and extract API-relevant information:

#### 3a. Controllers (`app/controllers/api/v3/`)

Look for:
- **New controller files** → new API resource with endpoints
- **New actions** (`def index`, `def show`, `def create`, `def update`, `def destroy`) → new operations
- **`requires_version_change`** → which version change gates this endpoint
- **`render_json Api::V3::Models::XxxResponse`** → identifies the response model/presenter
- **`params.slice(...).permit(...)`** or **request parser classes** (`RequestParser`, `StrongParams`) → request body fields
- **Error handling** (`raise Api::V3::Errors::ApiCodedError`) → error responses
- **`before_action :check_api_version!`** → version-gated endpoint

#### 3b. Models/Presenters (`app/presenters/api/v3/` or `app/lib/api/v3/models/`)

Look for:
- **`serialized_attributes do`** blocks → response schema properties
- **`attribute :field_name`** → schema field definition
- **`stringify: true`** → field is string type (even if integer in DB)
- **`from_model` method** → how the model maps from internal objects
- **Conditional attributes** based on version → version-specific fields

#### 3c. Version Changes (`app/lib/api/versioning/changes/`)

Look for:
- **`define_description`** → description of the API change (use in PR/commit message)
- **`define_is_breaking`** → whether this is a breaking change
- **`define_is_ready_for_release`** → usually `false` for new changes
- **`define_transformation ... data.except(:field1, :field2)`** → these fields are NEW (removed for old versions)
- **`define_transformation` with data modification** → field format/value changed between versions

#### 3d. Version Registration (`app/lib/api/versioning/service.rb`)

Look for which version block the new change is added to:
- `PreviewVersion.new(changes: [...])` → goes in Preview (version `0/`)
- `Version.new(id: "2.15", changes: [...])` → goes in that specific version

#### 3e. Routes (`config/routes/api_v3.rb`)

Look for:
- `resources :things` → standard CRUD: index, show, create, update, destroy
- `resources :things, only: [:index, :show]` → limited operations
- `member do ... end` → actions on specific resource (e.g., PUT `/things/{id}/action`)
- `collection do ... end` → actions on resource collection (e.g., POST `/things/search`)
- Nested resources → parent/child paths (e.g., `/contacts/{id}/tags`)

#### 3f. OAuth Scopes (`app/lib/policy/api_controller_routes_oauth_scope_policy.rb`)

Look for scope mappings to understand required auth scope for the endpoint.

### Step 4: Ask User for Version Targeting

Present the findings and ask:

```
I found the following API changes in PR #XXXXX:
- [list of changes found]

Which API versions should I update?
- Preview only (default for new features)
- Specific versions (for bug fixes/backports)
```

Default to Preview (`descriptions/0/api.intercom.io.yaml`) unless the PR clearly targets specific versions.

### Step 5: Read Target Spec File(s)

Read the target spec file(s) to understand:
- Existing endpoints in the same resource group (for consistent naming/style)
- Existing schemas that can be reused or extended
- The `intercom_version` enum (to verify version values)
- Where to insert new paths/schemas (maintain alphabetical or logical grouping)
- **All inline examples that reference the affected schema** — when adding a field, you must update every response example that returns that schema. Search with: `grep -n 'schemas/<name>' <spec_file>`
- **Existing example values** for the same resource — reuse the same style of IDs, workspace IDs, timestamps, and names that nearby endpoints use. Consistency matters more than novelty.

### Step 6: Generate OpenAPI Changes

Read the appropriate reference file based on what the PR changes:

- **Adding/modifying fields or schemas?** → Read [./ruby-to-openapi-mapping.md](./ruby-to-openapi-mapping.md) for how Ruby presenter attributes map to OpenAPI types
- **Adding new endpoints?** → Read [./openapi-patterns.md](./openapi-patterns.md) for concrete YAML templates (GET, POST, PUT, DELETE, search)
- **Updating multiple versions?** → Read [./version-propagation.md](./version-propagation.md) for the decision tree on which files to update

#### The two most important rules

**Rule 1: Field additions require updates in TWO places.** When adding a field to a schema, you must update both the schema definition in `components/schemas` AND every inline response example that returns that schema. Find all affected examples with:
```bash
grep -n 'schemas/<schema_name>' descriptions/0/api.intercom.io.yaml
```

**Rule 2: New resources need a top-level tag.** If adding an entirely new API resource, add an entry to the `tags` array at the bottom of the spec (alphabetical order). The tag name must match the `tags` on endpoints and `x-tags` on schemas. See existing tags in [./openapi-patterns.md](./openapi-patterns.md) under "Top-Level Tags".

#### Quick checklist for new endpoints

Every endpoint needs: `summary`, `description`, `operationId` (unique, camelCase), `tags`, `Intercom-Version` header parameter (`"$ref": "#/components/schemas/intercom_version"`), response with inline examples + schema `$ref`, and at minimum a `401 Unauthorized` error response. POST/PUT endpoints also need a `requestBody` with schema and examples. See [./openapi-patterns.md](./openapi-patterns.md) for complete templates.

**Writing good descriptions:** Extract the description from the PR's version change `define_description` if available — it's usually well-written for the changelog. Supplement with details from the controller (constraints, validations, edge cases). A good description explains what the endpoint does AND when you'd use it, not just "You can do X."

**Response example detail level:** Match the verbosity of existing examples for the same schema. If other ticket endpoints show a full ticket object with nested `ticket_parts`, `contacts`, and `linked_objects`, your example should too. If they're minimal (just `type` and `id`), keep yours minimal. Look at the nearest sibling endpoint for the right level of detail.

#### Quick checklist for new schemas

Every schema needs: `title` (Title Case), `type: object`, `x-tags`, `description`, and `properties` where each property has `type`, `description`, and `example`. Mark nullable fields explicitly with `nullable: true`. Timestamps use `type: integer` + `format: date-time`.

### Step 7: Apply Changes

Use the Edit tool to insert changes into the spec file(s). Be careful about:
- YAML indentation (2-space indent throughout)
- Inserting paths in logical order (group related endpoints together)
- Inserting schemas alphabetically in `components/schemas`
- Adding new top-level tags in alphabetical order in the `tags` array
- Not breaking existing content

### Step 8: Validate

Run Fern validation:
```bash
fern check
```

If `fern` is not installed, fall back to YAML syntax validation:
```bash
python3 -c "import yaml; yaml.safe_load(open('descriptions/0/api.intercom.io.yaml'))" && echo "YAML valid"
```

If validation fails, read the error output and fix the issues. Common problems: indentation errors, missing quotes on string values that look like numbers, and duplicate keys.

### Step 9: Summarize

Report to the user:
- What was added/changed (new endpoints, new schemas, new fields, new top-level tags)
- Which files were modified
- Which versions were updated
- Any manual follow-up needed

#### Follow-up Checklist

Always remind the user of remaining manual steps:

1. **Review generated changes** for accuracy against the actual API behavior
2. **Fern overrides** — if new endpoints were added to Preview, check if `fern/preview-openapi-overrides.yml` needs SDK method name entries
3. **Developer-docs PR** — copy the updated spec to the `developer-docs` repo:
   - Copy `descriptions/0/api.intercom.io.yaml` → `docs/references/@Preview/rest-api/api.intercom.io.yaml`
   - For stable versions: `descriptions/2.15/api.intercom.io.yaml` → `docs/references/@2.15/rest-api/api.intercom.io.yaml`
4. **Changelog** — if the change should appear in the public changelog, update `docs/references/@<version>/changelog.md` in the developer-docs repo (newest entries at top)
5. **Cross-version changes** — if this is an unversioned change (affects all versions), also update `docs/build-an-integration/learn-more/rest-apis/unversioned-changes.md` in developer-docs
6. **Run `fern check`** to validate before committing

## Important Notes

- **Do NOT run `fern generate` without `--preview`** — this would auto-submit PRs to SDK repos
- **Match existing examples** — before writing new example values, look at how nearby endpoints for the same resource format their examples. Reuse the same style of IDs (`'494'` not `'1'`), workspace IDs (`this_is_an_id664_that_should_be_at_least_`), timestamps (recent UNIX timestamps like `1719493065`), and names. Consistency across the spec is more important than creativity.
- **Match existing style** — look at nearby endpoints for naming, formatting, and level of detail in response examples. If sibling endpoints show full nested objects, yours should too.
- **Extract descriptions from the PR** — the version change's `define_description` is usually well-written. Use it as the basis for your endpoint description, then enrich with constraints and edge cases from the controller code.
- **Cross-reference with existing schemas** — reuse `$ref` to existing schemas wherever possible
- **Nullable fields** — always explicitly mark with `nullable: true`
- **The `error` schema** is already defined — always reference it with `"$ref": "#/components/schemas/error"`
- **Top-level tags** — new resources need a tag in the `tags` array at the bottom of the spec
- **Servers** — the spec already defines 3 regional servers (US, EU, AU) — do not modify
- **Security** — global `bearerAuth` is already configured — do not modify
