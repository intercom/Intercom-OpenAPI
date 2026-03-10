# OpenAPI YAML Patterns

Concrete templates extracted from the actual Intercom OpenAPI spec. Use these as the basis for generating new endpoints and schemas.

## Endpoint Patterns

### GET List Endpoint

```yaml
"/tags":
  get:
    summary: List all tags
    parameters:
    - name: Intercom-Version
      in: header
      schema:
        "$ref": "#/components/schemas/intercom_version"
    tags:
    - Tags
    operationId: listTags
    description: "You can fetch a list of all tags for a given workspace.\n\n"
    responses:
      '200':
        description: successful
        content:
          application/json:
            examples:
              successful:
                value:
                  type: list
                  data:
                  - type: tag
                    id: '102'
                    name: Manual tag 1
            schema:
              "$ref": "#/components/schemas/tag_list"
      '401':
        description: Unauthorized
        content:
          application/json:
            examples:
              Unauthorized:
                value:
                  type: error.list
                  request_id: 2859da57-c83f-405c-8166-240a312442a3
                  errors:
                  - code: unauthorized
                    message: Access Token Invalid
            schema:
              "$ref": "#/components/schemas/error"
```

### GET List with Pagination

```yaml
"/contacts":
  get:
    summary: List all contacts
    parameters:
    - name: Intercom-Version
      in: header
      schema:
        "$ref": "#/components/schemas/intercom_version"
    - name: page
      in: query
      description: The page of results to fetch.
      schema:
        type: integer
        example: 1
    - name: per_page
      in: query
      description: The number of results per page.
      schema:
        type: integer
        example: 50
    tags:
    - Contacts
    operationId: ListContacts
    description: |
      You can fetch a list of all contacts (ie. users or leads) in your workspace.
      {% admonition type="warning" name="Pagination" %}
        You can use pagination to limit the number of results returned.
      {% /admonition %}
    responses:
      '200':
        description: successful
        content:
          application/json:
            examples:
              successful:
                value:
                  type: list
                  data: []
                  total_count: 0
                  pages:
                    type: pages
                    page: 1
                    per_page: 50
                    total_pages: 0
            schema:
              "$ref": "#/components/schemas/contact_list"
      '401':
        description: Unauthorized
        content:
          application/json:
            examples:
              Unauthorized:
                value:
                  type: error.list
                  request_id: e097e446-9ae6-44a8-8e13-2bf3008b87ef
                  errors:
                  - code: unauthorized
                    message: Access Token Invalid
            schema:
              "$ref": "#/components/schemas/error"
```

### GET by ID Endpoint

```yaml
"/tags/{id}":
  get:
    summary: Find a specific tag
    parameters:
    - name: Intercom-Version
      in: header
      schema:
        "$ref": "#/components/schemas/intercom_version"
    - name: id
      in: path
      description: The unique identifier of a given tag
      example: '123'
      required: true
      schema:
        type: string
    tags:
    - Tags
    operationId: findTag
    description: |
      You can fetch the details of tags that are on the workspace by their id.
      This will return a tag object.
    responses:
      '200':
        description: Tag found
        content:
          application/json:
            examples:
              Tag found:
                value:
                  type: tag
                  id: '113'
                  name: Manual tag
            schema:
              "$ref": "#/components/schemas/tag_basic"
      '404':
        description: Tag not found
        content:
          application/json:
            examples:
              Tag not found:
                value:
                  type: error.list
                  request_id: e20c89d2-29c6-4abb-aa3d-c860e1cec1ca
                  errors:
                  - code: not_found
                    message: Resource Not Found
            schema:
              "$ref": "#/components/schemas/error"
      '401':
        description: Unauthorized
        content:
          application/json:
            examples:
              Unauthorized:
                value:
                  type: error.list
                  request_id: f230e3a7-00a9-456b-bf1c-2ad4b7dc49f6
                  errors:
                  - code: unauthorized
                    message: Access Token Invalid
            schema:
              "$ref": "#/components/schemas/error"
```

### POST Create Endpoint

```yaml
"/contacts":
  post:
    summary: Create contact
    parameters:
    - name: Intercom-Version
      in: header
      schema:
        "$ref": "#/components/schemas/intercom_version"
    tags:
    - Contacts
    operationId: CreateContact
    description: You can create a new contact (ie. user or lead).
    responses:
      '200':
        description: successful
        content:
          application/json:
            examples:
              successful:
                value:
                  type: contact
                  id: 6762f0dd1bb69f9f2193bb83
                  email: joebloggs@intercom.io
                  created_at: 1734537437
            schema:
              "$ref": "#/components/schemas/contact"
      '401':
        description: Unauthorized
        content:
          application/json:
            examples:
              Unauthorized:
                value:
                  type: error.list
                  request_id: ff2353d3-d3d6-4f20-8268-847869d01e73
                  errors:
                  - code: unauthorized
                    message: Access Token Invalid
            schema:
              "$ref": "#/components/schemas/error"
    requestBody:
      content:
        application/json:
          schema:
            "$ref": "#/components/schemas/create_contact_request"
          examples:
            successful:
              summary: successful
              value:
                email: joebloggs@intercom.io
```

### PUT Update Endpoint

```yaml
"/admins/{id}/away":
  put:
    summary: Set an admin to away
    parameters:
    - name: Intercom-Version
      in: header
      schema:
        "$ref": "#/components/schemas/intercom_version"
    - name: id
      in: path
      required: true
      description: The unique identifier of a given admin
      schema:
        type: integer
    tags:
    - Admins
    operationId: setAwayAdmin
    description: You can set an Admin as away for the Inbox.
    responses:
      '200':
        description: Successful response
        content:
          application/json:
            examples:
              Successful response:
                value:
                  type: admin
                  id: '991267460'
                  name: Ciaran2 Lee
                  email: admin2@email.com
                  away_mode_enabled: true
                  away_mode_reassign: true
                  has_inbox_seat: true
            schema:
              "$ref": "#/components/schemas/admin"
      '404':
        description: Admin not found
        content:
          application/json:
            examples:
              Admin not found:
                value:
                  type: error.list
                  request_id: efcd0531-798b-4c22-bccd-68877ed7faa4
                  errors:
                  - code: admin_not_found
                    message: Admin for admin_id not found
            schema:
              "$ref": "#/components/schemas/error"
    requestBody:
      content:
        application/json:
          schema:
            type: object
            required:
            - away_mode_enabled
            - away_mode_reassign
            properties:
              away_mode_enabled:
                type: boolean
                description: Set to "true" to change the status of the admin to away.
                example: true
              away_mode_reassign:
                type: boolean
                description: Set to "true" to assign new replies to default inbox.
                example: false
          examples:
            successful_response:
              summary: Successful response
              value:
                away_mode_enabled: true
                away_mode_reassign: true
```

### DELETE Endpoint

```yaml
"/tags/{id}":
  delete:
    summary: Delete tag
    parameters:
    - name: Intercom-Version
      in: header
      schema:
        "$ref": "#/components/schemas/intercom_version"
    - name: id
      in: path
      description: The unique identifier of a given tag
      example: '123'
      required: true
      schema:
        type: string
    tags:
    - Tags
    operationId: deleteTag
    description: You can delete tags by passing in the id.
    responses:
      '200':
        description: Successful
      '404':
        description: Resource not found
        content:
          application/json:
            examples:
              Resource not found:
                value:
                  type: error.list
                  request_id: 49536975-bbc5-4a2f-ab8b-7928275cb4d3
                  errors:
                  - code: not_found
                    message: Resource Not Found
            schema:
              "$ref": "#/components/schemas/error"
      '401':
        description: Unauthorized
        content:
          application/json:
            examples:
              Unauthorized:
                value:
                  type: error.list
                  request_id: a3e5b8e2-1234-5678-9abc-def012345678
                  errors:
                  - code: unauthorized
                    message: Access Token Invalid
            schema:
              "$ref": "#/components/schemas/error"
```

### POST Search Endpoint

```yaml
"/conversations/search":
  post:
    summary: Search conversations
    parameters:
    - name: Intercom-Version
      in: header
      schema:
        "$ref": "#/components/schemas/intercom_version"
    tags:
    - Conversations
    operationId: searchConversations
    description: |
      You can search for multiple conversations by the value of their attributes.
    responses:
      '200':
        description: successful
        content:
          application/json:
            examples:
              successful:
                value:
                  type: conversation.list
                  conversations: []
                  total_count: 0
                  pages:
                    type: pages
                    page: 1
                    per_page: 20
                    total_pages: 0
            schema:
              "$ref": "#/components/schemas/conversation_list"
    requestBody:
      content:
        application/json:
          schema:
            "$ref": "#/components/schemas/search_request"
          examples:
            successful:
              summary: successful
              value:
                query:
                  operator: AND
                  value:
                  - field: created_at
                    operator: ">"
                    value: '1306054154'
```

---

## Schema Patterns

### Simple Object Schema

```yaml
tag_basic:
  title: Tag
  type: object
  x-tags:
  - Tags
  description: A tag allows you to label your contacts, companies, and conversations.
  properties:
    type:
      type: string
      description: value is "tag"
      example: tag
    id:
      type: string
      description: The id of the tag.
      example: '123'
    name:
      type: string
      description: The name of the tag.
      example: Test tag
```

### Schema with Nullable Fields

```yaml
tag:
  title: Tag
  type: object
  x-tags:
  - Tags
  description: A tag allows you to label your contacts, companies, and conversations.
  properties:
    type:
      type: string
      description: value is "tag"
      example: tag
    id:
      type: string
      description: The id of the tag.
      example: '123'
    name:
      type: string
      description: The name of the tag.
      example: Test tag
    applied_at:
      type: integer
      format: date-time
      nullable: true
      description: The time when the tag was applied to the object.
      example: 1663597223
    applied_by:
      type: object
      nullable: true
      description: The admin who applied the tag.
      allOf:
      - "$ref": "#/components/schemas/reference"
```

### List/Collection Schema

```yaml
tag_list:
  title: Tags
  type: object
  description: A list of tags objects in the workspace.
  properties:
    type:
      type: string
      description: The type of the object
      enum:
      - list
      example: list
    data:
      type: array
      description: A list of tags objects
      items:
        "$ref": "#/components/schemas/tag"
```

### Request Body Schema

```yaml
create_or_update_tag_request:
  title: Create or Update Tag Request Payload
  type: object
  description: You can create or update an existing tag.
  required:
  - name
  properties:
    name:
      type: string
      description: The name of the tag, which will be created if not found.
      example: Independent
    id:
      type: string
      description: The id of tag to updates.
      example: '656452352'
```

### Schema with Enum

```yaml
activity_log:
  title: Activity Log
  type: object
  description: Activities performed by Admins.
  nullable: true
  properties:
    activity_type:
      type: string
      enum:
      - admin_away_mode_change
      - admin_deletion
      - admin_login_success
      - app_name_change
      example: app_name_change
```

### Nested Reference (allOf pattern)

Use `allOf` when referencing another schema as a nullable property:

```yaml
properties:
  applied_by:
    type: object
    nullable: true
    description: The admin who applied the tag.
    allOf:
    - "$ref": "#/components/schemas/reference"
```

Direct `$ref` when the field is not nullable:
```yaml
properties:
  assignee:
    "$ref": "#/components/schemas/admin"
```

### Paginated List Schema

```yaml
contact_list:
  title: Contact List
  type: object
  description: A list of contacts.
  properties:
    type:
      type: string
      enum:
      - list
      example: list
    data:
      type: array
      items:
        "$ref": "#/components/schemas/contact"
    total_count:
      type: integer
      description: Total number of contacts.
      example: 100
    pages:
      "$ref": "#/components/schemas/cursor_pages"
```

---

## Common Reusable Schemas

These schemas already exist in the spec. Always use `$ref` instead of redefining:

| Schema | Use for |
|---|---|
| `error` | All error responses |
| `cursor_pages` | Pagination metadata in list responses |
| `reference` | Simple `{type, id}` reference to another object |
| `intercom_version` | The `Intercom-Version` header enum |
| `admin` | Admin/teammate objects |
| `contact` | Contact (user/lead) objects |
| `tag` | Tag with applied_at/applied_by |
| `tag_basic` | Tag without applied_at/applied_by |
| `tag_list` | List of tags |

---

## Top-Level Spec Sections

These sections appear at the bottom of each spec file (after `components/schemas`). Only modify when adding entirely new API resources.

### Top-Level Tags (add for new resources)

Located after `security:` at the end of the file. Tags define resource groups in the API docs sidebar.

```yaml
tags:
- name: Admins
  description: Everything about your Admins
- name: Articles
  description: Everything about your Articles
# ... alphabetically ordered ...
- name: Your New Resource
  description: Everything about your New Resource
```

Some tags have extended descriptions or `externalDocs`:
```yaml
- name: Conversations
  description: Everything about your Conversations
  externalDocs:
    description: What is a conversation?
    url: https://www.intercom.com/help/en/articles/4323904-what-is-a-conversation
```

Some tags use admonitions in descriptions:
```yaml
- name: Custom Object Instances
  description: |
    Everything about your Custom Object instances.
    {% admonition type="warning" name="Permission Requirements" %}
      From now on, to access this endpoint, you need additional permissions.
    {% /admonition %}
```

### Servers (do NOT modify)

```yaml
servers:
- url: https://api.intercom.io
  description: The production API server
- url: https://api.eu.intercom.io
  description: The european API server
- url: https://api.au.intercom.io
  description: The australian API server
```

### Security (do NOT modify)

```yaml
security:
- bearerAuth: []
```

### Reusable Responses (`components/responses`)

The spec defines reusable error responses. Most endpoints inline their errors, but these are available:

```yaml
components:
  responses:
    Unauthorized:
      description: Unauthorized
      content:
        application/json:
          examples:
            Unauthorized:
              value:
                type: error.list
                request_id: 12a938a3-314e-4939-b773-5cd45738bd21
                errors:
                - code: unauthorized
                  message: Access Token Invalid
          schema:
            "$ref": "#/components/schemas/error"
```

---

## Style Rules

1. **Indentation**: 2 spaces throughout
2. **Strings**: Quote strings that could be ambiguous YAML (`'200'`, `'123'`, `'true'`)
3. **Descriptions**: Use `|` for multi-line descriptions, inline for single-line
4. **Examples**: Use realistic but fake data (not real customer data)
5. **Request IDs**: Use UUID format for `request_id` in error examples
6. **Timestamps**: Integer UNIX timestamps (e.g., `1734537437`), not ISO strings
7. **IDs**: String-quoted integers (e.g., `'123'`) for most resource IDs
8. **Refs**: Use `"$ref"` (quoted, with dollar sign) for JSON references
9. **Enum values**: Always include an `example` that matches one of the enum values
10. **operationId**: Must be unique across the entire spec
11. **Top-level tags**: Alphabetical order, required for new resources
