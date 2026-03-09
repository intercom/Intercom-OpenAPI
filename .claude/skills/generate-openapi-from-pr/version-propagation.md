# Version Propagation Guide

How to decide which API version spec files to update and how to propagate changes across versions.

## Version Directory Mapping

| Version | Directory | intercom_version default | Notes |
|---|---|---|---|
| Unstable | `descriptions/0/` | `Unstable` | All new features land here first |
| 2.15 | `descriptions/2.15/` | `2.14` | Current latest stable |
| 2.14 | `descriptions/2.14/` | `2.14` | |
| 2.13 | `descriptions/2.13/` | `2.11` | |
| 2.12 | `descriptions/2.12/` | `2.11` | |
| 2.11 | `descriptions/2.11/` | `2.11` | |
| 2.10 | `descriptions/2.10/` | `2.10` | |
| 2.9 | `descriptions/2.9/` | `2.9` | |
| 2.8 | `descriptions/2.8/` | `2.8` | |
| 2.7 | `descriptions/2.7/` | `2.7` | |

## Decision Tree: Which Versions to Update

### 1. New Feature (most common)

**Update: Unstable only** (`descriptions/0/api.intercom.io.yaml`)

If the PR adds the version change to `UnstableVersion` in the versioning service, only update the Unstable spec. This is the case for ~95% of API changes.

### 2. Bug Fix to Existing Documentation

**Update: All affected versions**

If the PR fixes a bug in how an existing field/endpoint is documented (wrong type, missing example, incorrect description), propagate the fix to all versions that have the endpoint.

### 3. Feature Promoted to Stable Version

**Update: Target version + all later versions + Unstable**

If the PR adds a version change to a specific numbered version (e.g., `Version.new(id: "2.15")`), update that version and all later versions. Features in a numbered version are also in all subsequent versions.

Example: Change added to 2.14 → update 2.14, 2.15, and Unstable.

### 4. Backport to Older Versions

**Update: All specified versions**

Rare. If the PR explicitly mentions backporting, update all specified versions. Check the PR description and version change registration for which versions are affected.

## Key Differences Between Version Files

### intercom_version Enum

Each version's spec has a different enum for `intercom_version`:

**Unstable** includes all versions plus `Unstable`:
```yaml
intercom_version:
  example: Unstable
  default: Unstable
  enum:
  - '1.0'
  - '1.1'
  # ... all versions ...
  - '2.14'
  - Unstable
```

**Stable versions** include all versions up to and including themselves:
```yaml
# v2.15
intercom_version:
  example: '2.14'
  default: '2.14'
  enum:
  - '1.0'
  - '1.1'
  # ... all versions up to ...
  - '2.14'
```

Note: Stable specs set `default` to the previous stable version and do NOT include their own version number in the enum. For example, v2.15 has `default: '2.14'` and does not list `'2.15'`. Always check the actual file to confirm the pattern before editing — it may evolve with future releases.

### info.version

Each spec has a different `info.version`:
```yaml
# Unstable
info:
  version: Unstable

# v2.15
info:
  version: '2.15'
```

### Available Endpoints

Unstable has endpoints that don't exist in stable versions. When adding an endpoint to Unstable, do NOT add it to stable versions unless the corresponding version change is registered in that version's change list.

### Schema Differences

Some schemas have additional fields in Unstable that don't exist in stable versions. When propagating a fix, be careful not to add Unstable-only fields to stable versions.

## Propagation Checklist

When updating multiple versions:

1. **Start with Unstable** — make the change in `descriptions/0/api.intercom.io.yaml`
2. **Copy to each target version** — replicate the same change in each version file
3. **Verify consistency** — ensure the change makes sense in context of each version (don't add references to schemas that don't exist in older versions)
4. **Check intercom_version** — do NOT modify the `intercom_version` enum unless explicitly adding a new API version
5. **Run validation** — `fern check` validates the spec used by Fern (currently v2.14 + Unstable), but manually review other versions

## Fern Validation Scope

`fern check` only validates:
- `descriptions/2.14/api.intercom.io.yaml` (stable SDK source)
- `descriptions/0/api.intercom.io.yaml` (unstable SDK source)

Changes to other version files (2.7-2.13, 2.15) are NOT validated by Fern. Be extra careful with YAML syntax in those files.

## Fern Overrides

When adding new endpoints to Unstable, you may need to add entries to `fern/unstable-openapi-overrides.yml` for SDK method naming:

```yaml
paths:
  '/your_new_endpoint':
    get:
      x-fern-sdk-group-name:
        - yourResource
      x-fern-sdk-method-name: list
      x-fern-request-name: ListYourResourceRequest
```

Check existing entries in the overrides file for the pattern. Not all endpoints need overrides — Fern can often infer good names from the spec.
