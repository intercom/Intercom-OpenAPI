---
name: generate-openapi-from-pr
description: Generate OpenAPI spec changes from an intercom monolith PR. Use when a user provides an intercom/intercom PR URL or number and wants to create the corresponding OpenAPI documentation changes in this repo.

metadata:
  author: team-data-foundations
  version: "1.0"
  user-invocable: true
  argument-hint: "<intercom-pr-url-or-number>"

allowed-tools: Task, Read, Glob, Grep, Write, Edit, Bash, AskUserQuestion
---

# Generate OpenAPI Spec from Intercom PR

This skill takes an intercom monolith PR (from `intercom/intercom`) and generates the corresponding OpenAPI spec changes in this repo (`Intercom-OpenAPI`).

## When to Activate

- User provides an `intercom/intercom` PR URL or number
- User asks to "generate docs from PR", "create OpenAPI from PR", "document this API change"

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
- `UnstableVersion.new(changes: [...])` → goes in Unstable (version `0/`)
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
- Unstable only (default for new features)
- Specific versions (for bug fixes/backports)
```

Default to Unstable (`descriptions/0/api.intercom.io.yaml`) unless the PR clearly targets specific versions.

### Step 5: Read Target Spec File(s)

Read the target spec file(s) to understand:
- Existing endpoints in the same resource group (for consistent naming/style)
- Existing schemas that can be reused or extended
- The `intercom_version` enum (to verify version values)
- Where to insert new paths/schemas (maintain alphabetical or logical grouping)
- **All inline examples that reference the affected schema** — when adding a field, you must update every response example that returns that schema. Search with: `grep -n 'schemas/<name>' <spec_file>`

### Step 6: Generate OpenAPI Changes

Use the patterns from the companion guide files:
- **[./ruby-to-openapi-mapping.md](./ruby-to-openapi-mapping.md)** — Ruby pattern → OpenAPI mapping rules
- **[./openapi-patterns.md](./openapi-patterns.md)** — Concrete YAML templates
- **[./version-propagation.md](./version-propagation.md)** — Cross-version propagation rules

#### Adding a new field to an existing schema (most common change)

This is the most frequent PR type. You must update TWO places in the spec:

1. **Schema property** — add the new field to `components/schemas/<schema_name>/properties`
2. **Inline response examples** — search for ALL endpoints that return this schema and update their inline example `value` objects to include the new field

Example from a real PR (adding `previous_ticket_state_id` to ticket):
```yaml
# 1. In components/schemas/ticket/properties — add the field:
previous_ticket_state_id:
  type: string
  nullable: true
  description: The ID of the previous ticket state.
  example: '7493'

# 2. In EVERY endpoint response example that returns a ticket — add the value:
examples:
  Successful response:
    value:
      type: ticket
      id: '494'
      # ... existing fields ...
      previous_ticket_state_id: '7490'    # ADD THIS
```

**To find all examples that need updating**, search the spec file for the schema name:
```bash
grep -n 'schemas/ticket' descriptions/0/api.intercom.io.yaml
```
Then check each endpoint that references that schema and update its inline examples.

#### Required elements for every new endpoint:

1. **`summary`** — short description used as page title in docs (required)

2. **`description`** — longer explanation of what the endpoint does

3. **`Intercom-Version` header parameter** — always reference the schema:
   ```yaml
   parameters:
   - name: Intercom-Version
     in: header
     schema:
       "$ref": "#/components/schemas/intercom_version"
   ```

4. **`tags`** — group name matching existing tags or new tag for new resource

5. **`operationId`** — unique, camelCase identifier (e.g., `listTags`, `createContact`, `retrieveTicket`)

6. **Response with inline examples + schema ref**:
   ```yaml
   responses:
     '200':
       description: Successful response
       content:
         application/json:
           examples:
             Successful response:
               value:
                 type: resource
                 id: '123'
           schema:
             "$ref": "#/components/schemas/resource_schema"
   ```

7. **Standard error responses** — at minimum `401 Unauthorized`:
   ```yaml
   '401':
     description: Unauthorized
     content:
       application/json:
         examples:
           Unauthorized:
             value:
               type: error.list
               request_id: <uuid>
               errors:
               - code: unauthorized
                 message: Access Token Invalid
         schema:
           "$ref": "#/components/schemas/error"
   ```

8. **Request body** (for POST/PUT) with schema and examples

#### Required elements for new schemas:

1. **`title`** — Title Case
2. **`type: object`**
3. **`x-tags`** — tag group linkage (must match a top-level tag name)
4. **`description`**
5. **`properties`** — each with `type`, `description`, `example`
6. **`nullable: true`** — on fields that can be null
7. **Timestamps** — `type: integer` + `format: date-time`

#### Top-level `tags` section (for new resources)

If adding a completely new API resource (not just new endpoints on an existing resource), you MUST add a tag entry to the **top-level `tags` array** at the bottom of the spec file (after `security`):

```yaml
tags:
# ... existing tags ...
- name: Your Resource
  description: Everything about your Resource
```

This tag name must match:
- The `tags` array on each endpoint (e.g., `tags: [Your Resource]`)
- The `x-tags` on related schemas (e.g., `x-tags: [Your Resource]`)

Existing top-level tags include: Admins, AI Content, Articles, Away Status Reasons, Brands, Calls, Companies, Contacts, Conversations, Custom Channel Events, Custom Object Instances, Data Attributes, Data Events, Data Export, Emails, Help Center, Internal Articles, Jobs, Macros, Messages, News, Notes, Segments, Subscription Types, Switch, Tags, Teams, Ticket States, Ticket Type Attributes, Ticket Types, Tickets, Visitors, Workflows.

#### Reusable `components/responses` (optional)

The spec defines reusable error responses in `components/responses`:
- `Unauthorized` — 401 with access token invalid
- `TypeNotFound` — 404 for custom object types
- `ObjectNotFound` — 404 for objects/custom objects/integrations
- `ValidationError` — validation errors
- `BadRequest` — bad request errors
- `CustomChannelNotificationSuccess` — custom channel success

You can reference these with `"$ref": "#/components/responses/Unauthorized"` instead of inlining the error response, but most existing endpoints inline their errors. **Match the style of nearby endpoints** in the same resource group.

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

If validation fails, read the error output and fix the issues.

### Step 9: Summarize

Report to the user:
- What was added/changed (new endpoints, new schemas, new fields, new top-level tags)
- Which files were modified
- Which versions were updated
- Any manual follow-up needed

#### Follow-up Checklist

Always remind the user of remaining manual steps:

1. **Review generated changes** for accuracy against the actual API behavior
2. **Fern overrides** — if new endpoints were added to Unstable, check if `fern/unstable-openapi-overrides.yml` needs SDK method name entries
3. **Developer-docs PR** — copy the updated spec to the `developer-docs` repo:
   - Copy `descriptions/0/api.intercom.io.yaml` → `docs/references/@Unstable/rest-api/api.intercom.io.yaml`
   - For stable versions: `descriptions/2.15/api.intercom.io.yaml` → `docs/references/@2.15/rest-api/api.intercom.io.yaml`
4. **Changelog** — if the change should appear in the public changelog, update `docs/references/@<version>/changelog.md` in the developer-docs repo (newest entries at top)
5. **Cross-version changes** — if this is an unversioned change (affects all versions), also update `docs/build-an-integration/learn-more/rest-apis/unversioned-changes.md` in developer-docs
6. **Run `fern check`** to validate before committing

## Important Notes

- **Do NOT run `fern generate` without `--preview`** — this would auto-submit PRs to SDK repos
- **Examples must be realistic** — use plausible IDs, emails, timestamps
- **Match existing style** — look at nearby endpoints for naming and formatting conventions
- **Cross-reference with existing schemas** — reuse `$ref` to existing schemas wherever possible
- **Nullable fields** — always explicitly mark with `nullable: true`
- **The `error` schema** is already defined — always reference it with `"$ref": "#/components/schemas/error"`
- **Top-level tags** — new resources need a tag in the `tags` array at the bottom of the spec
- **Servers** — the spec already defines 3 regional servers (US, EU, AU) — do not modify
- **Security** — global `bearerAuth` is already configured — do not modify
