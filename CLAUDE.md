# Intercom OpenAPI Specifications

Source of truth for Intercom's public REST API [OpenAPI 3.0.1](https://www.openapis.org/) specs. Changes here drive SDK generation (TypeScript, Java, Python, PHP), Postman collections, and are manually synced to [developer-docs](https://github.com/intercom/developer-docs).

Owner: `team-data-foundations` (see `REPO_OWNER`)

## Structure

```
descriptions/
  2.7/ ... 2.15/            # Stable versioned API specs (one YAML each)
  0/                         # Unstable version (version "0" internally)
fern/
  generators.yml             # SDK generation config (TS, Java, Python, PHP)
  openapi-overrides.yml      # Fern overrides for stable spec (v2.14)
  unstable-openapi-overrides.yml  # Fern overrides for Unstable
  fern.config.json           # Fern org config
scripts/
  run-sync.js                # Entry point for spec upload (CI only)
  upload-api-specification.js # Upload logic for ReadMe API
  postman/                   # Postman collection generation
postman/                     # Postman collection outputs
```

## Key Files

- **API specs**: `descriptions/<version>/api.intercom.io.yaml` — one self-contained OpenAPI 3.0.1 YAML per version (~23K lines for v2.15)
- **SDK config**: `fern/generators.yml` — defines 4 SDK groups: `ts-sdk`, `java-sdk`, `python-sdk`, `php-sdk`
- **Fern overrides**: `fern/openapi-overrides.yml` — patches applied on top of the spec for SDK generation

## Development

```bash
npm install
```

No dev server, no test suite, no linting commands. Validation is done via Fern:

```bash
npm install -g fern-api
fern check                              # Validate spec
fern generate --preview --group ts-sdk  # Preview SDK generation
```

## CI/CD (GitHub Actions)

| Workflow | Trigger | What it does |
|---|---|---|
| `fern_check.yml` | PR + push to main | Validates spec with `fern check` |
| `preview_sdks.yml` | PR (changes in `fern/`) | Preview-generates all 4 SDKs and compiles them |
| `ts-sdk.yml` | Manual dispatch | Releases TypeScript SDK to npm |
| `java-sdk.yml` | Manual dispatch | Releases Java SDK to Maven |
| `python-sdk.yml` | Manual dispatch | Releases Python SDK to PyPI |
| `php-sdk.yml` | Manual dispatch | Releases PHP SDK to Packagist |
| `generate_postman_collection.yml` | Push to main | Deploys updated Postman collections |

## Editing API Specs

### Adding/Modifying Fields

1. Edit `descriptions/<version>/api.intercom.io.yaml`
2. Add property definition with `type`, `description`, `example`, and `nullable` if applicable
3. Update inline response examples in the same file (examples are inline, schemas use `$ref`)
4. Apply change to ALL affected versions (specs are independent copies, not inherited)

### OpenAPI Conventions

```yaml
# Every property needs an example
field_name:
  type: string
  description: The field description.
  example: 'some-value'
  nullable: true          # Explicit when field can be null

# Response pattern: schema via $ref, examples inline
responses:
  '200':
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

### Cross-Version Changes

When a change applies to multiple API versions, you must edit each version's YAML independently. There is no inheritance between versions — each `descriptions/<version>/api.intercom.io.yaml` is a standalone file.

### Version Numbering

- Stable versions: `2.7`, `2.8`, ..., `2.15` (current latest)
- Unstable: stored as `descriptions/0/` (mapped from "Unstable" in upload scripts)
- Every endpoint requires an `Intercom-Version` header parameter

## SDK Generation (Fern)

SDKs are generated from the spec using [Fern](https://buildwithfern.com/). The `fern/generators.yml` configures:
- **Stable SDK source**: `descriptions/2.14/api.intercom.io.yaml` (note: v2.14, not v2.15)
- **Unstable SDK source**: `descriptions/0/api.intercom.io.yaml` (namespace: `unstable`)

### DANGER: Never run `fern generate` without `--preview` locally

Running `fern generate --group <name>` (without `--preview`) auto-submits PRs to the SDK GitHub repos. This is CI-only.

```bash
# SAFE — local preview only
fern generate --preview --group ts-sdk

# DANGEROUS — opens PRs on SDK repos!
fern generate --group ts-sdk
```

## PR Workflow

- PRs trigger `fern check` validation and SDK preview builds (if `fern/` changed)
- PR template asks for: what changed + which API versions are affected
- Merges to main auto-deploy Postman collections
- SDK releases are manual (workflow_dispatch)

## Skills

- **generate-openapi-from-pr** — Takes an intercom monolith PR and generates OpenAPI spec changes. Provide a PR URL/number from `intercom/intercom` and the skill analyzes the diff (controllers, presenters, version changes, routes) to produce the corresponding YAML updates in the target spec file(s). See `.claude/skills/generate-openapi-from-pr/SKILL.md`.

When a user provides an `intercom/intercom` PR URL or asks to generate OpenAPI docs from a PR, always use the `generate-openapi-from-pr` skill. Invoke it with: `/generate-openapi-from-pr <pr-url>`

## Downstream Consumers

Changes in this repo must be manually synced to:
- [intercom/developer-docs](https://github.com/intercom/developer-docs) — the spec YAMLs are copied into `docs/references/@<version>/rest-api/`
- SDK repos receive changes via Fern-generated PRs (automated on release)
