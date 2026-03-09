# Ruby-to-OpenAPI Mapping Reference

This guide maps common Ruby API patterns in the intercom monolith to their corresponding OpenAPI YAML output.

## Routes → Paths

### Standard RESTful Resources

```ruby
# Ruby route
resources :tags, only: [:index, :show, :create, :destroy]
```

Maps to:
```yaml
# OpenAPI paths
"/tags":
  get:       # index
    operationId: listTags
  post:      # create
    operationId: createTag
"/tags/{id}":
  get:       # show
    operationId: findTag
  delete:    # destroy
    operationId: deleteTag
```

### Member Routes (actions on a specific resource)

```ruby
# Ruby route
resources :admins, only: [:index, :show] do
  member do
    put :away
  end
end
```

Maps to:
```yaml
"/admins":
  get:
    operationId: listAdmins
"/admins/{id}":
  get:
    operationId: retrieveAdmin
"/admins/{id}/away":
  put:
    operationId: setAwayAdmin
```

### Collection Routes (actions on the resource collection)

```ruby
# Ruby route
resources :conversations do
  collection do
    post :search
  end
end
```

Maps to:
```yaml
"/conversations/search":
  post:
    operationId: searchConversations
```

### Nested Resources

```ruby
# Ruby route
resources :contacts do
  resources :tags, only: [:index, :create, :destroy]
end
```

Maps to:
```yaml
"/contacts/{contact_id}/tags":
  get:
    operationId: listTagsForAContact
  post:
    operationId: attachTagToContact
"/contacts/{contact_id}/tags/{id}":
  delete:
    operationId: detachTagFromContact
```

## Controller Actions → Operations

### Action Name Conventions

| Rails Action | HTTP Method | operationId Pattern | Example |
|---|---|---|---|
| `index` | GET | `list{Resources}` | `listTags` |
| `show` | GET | `retrieve{Resource}` or `find{Resource}` or `Show{Resource}` | `findTag` |
| `create` | POST | `create{Resource}` or `Create{Resource}` | `createTag` |
| `update` | PUT | `update{Resource}` or `Update{Resource}` | `UpdateContact` |
| `destroy` | DELETE | `delete{Resource}` | `deleteTag` |
| `search` | POST | `search{Resources}` | `searchConversations` |
| custom | varies | descriptive camelCase | `setAwayAdmin`, `convertVisitor` |

Note: operationId naming is inconsistent in the existing spec (some camelCase, some PascalCase). Match the style of the resource group you're adding to.

### Request Parameters

```ruby
# Controller code
def update
  tag = Tags::Update.run!(
    params.slice(:name, :id).permit(:name, :id),
    { app: current_app, admin: current_admin }
  )
end
```

Maps to request body:
```yaml
requestBody:
  content:
    application/json:
      schema:
        type: object
        properties:
          name:
            type: string
            description: The name of the tag.
            example: "Updated tag name"
          id:
            type: string
            description: The unique identifier of the tag.
            example: "123"
      examples:
        successful:
          summary: Successful update
          value:
            name: "Updated tag name"
            id: "123"
```

### Path Parameters

```ruby
# Controller with path param
def show
  tag = Tag.find(params[:id])
end
```

Maps to:
```yaml
parameters:
- name: id
  in: path
  description: The unique identifier of the tag.
  example: '123'
  required: true
  schema:
    type: string
```

### Query Parameters

```ruby
# Controller with query params
def index
  per_page = params[:per_page] || 50
  page = params[:page] || 1
end
```

Maps to:
```yaml
parameters:
- name: per_page
  in: query
  description: Number of results per page.
  schema:
    type: integer
    default: 50
- name: page
  in: query
  description: Page number.
  schema:
    type: integer
    default: 1
```

## Presenters/Models → Schemas

### Simple Presenter

```ruby
# Ruby presenter
class TagResponse < ::Api::Versioning::Presenter
  serialized_attributes do
    attribute :type
    attribute :id, stringify: true
    attribute :name
  end

  def type
    "tag"
  end
end
```

Maps to schema:
```yaml
components:
  schemas:
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
```

### Attribute Type Mapping

| Ruby/Presenter Pattern | OpenAPI Type |
|---|---|
| `attribute :name` (string field) | `type: string` |
| `attribute :id, stringify: true` | `type: string` (even though integer in DB) |
| `attribute :count` (integer field) | `type: integer` |
| `attribute :enabled` (boolean field) | `type: boolean` |
| `attribute :created_at` (timestamp) | `type: integer` + `format: date-time` |
| `attribute :items` (array) | `type: array` + `items:` |
| `attribute :metadata` (hash/object) | `type: object` |
| Field can be nil | Add `nullable: true` |

### Nested Object References

```ruby
# Presenter with nested object
class ConversationResponse
  serialized_attributes do
    attribute :assignee  # returns an Admin object
    attribute :tags      # returns a TagList object
  end
end
```

Maps to:
```yaml
properties:
  assignee:
    "$ref": "#/components/schemas/admin"
  tags:
    "$ref": "#/components/schemas/tag_list"
```

For nullable nested objects, use `allOf`:
```yaml
properties:
  applied_by:
    type: object
    nullable: true
    description: The admin who applied the tag.
    allOf:
    - "$ref": "#/components/schemas/reference"
```

### List/Collection Schema

```ruby
# List presenter
class TagListResponse
  def type; "list"; end
  attribute :data  # array of TagResponse
end
```

Maps to:
```yaml
tag_list:
  title: Tags
  type: object
  description: A list of tags.
  properties:
    type:
      type: string
      enum:
      - list
      example: list
    data:
      type: array
      description: A list of tags
      items:
        "$ref": "#/components/schemas/tag"
```

## Version Changes → What's New

### Field Addition (via transformation)

```ruby
# Version change that removes field for old versions
class AddTagsToConversationPart < ::Api::Versioning::Change
  define_transformation ::Api::V3::Models::VersionedConversationPartResponse do |target_model:, data:|
    data.except(:tags)
  end
end
```

This means: **`tags` is a NEW field** added in this version. It's removed from the response for older API versions.

In OpenAPI: Add the `tags` property to the response schema, and include it in response examples.

### Field Modification (via transformation)

```ruby
# Version change that modifies field format
class ChangeTimestampFormat < ::Api::Versioning::Change
  define_transformation ::Api::V3::Models::SomeResponse do |target_model:, data:|
    data.merge(created_at: data[:created_at].to_s)
  end
end
```

This means: the field format changed between versions. Document the new format.

### New Endpoint (via version gating)

```ruby
# Controller with version check
class TicketsController < OauthAuthenticatedController
  requires_version_change ::Api::Versioning::Changes::AddTicketsApi

  def show
    # ...
  end
end
```

This means: the entire endpoint only exists in versions that include `AddTicketsApi`. Add the endpoint to the Unstable spec (or whichever version includes the change).

### Version Registration Location

```ruby
# In app/lib/api/versioning/service.rb
UnstableVersion.new(changes: [
  Changes::AddNewFeature,    # → add to descriptions/0/
])

Version.new(id: "2.15", changes: [
  Changes::SomeOtherChange,  # → add to descriptions/2.15/
])
```

## Response Rendering → Response Schema

### Simple Response

```ruby
render_json Api::V3::Models::TagResponse.from_model(model: tag, api_version: current_api_version)
```

Maps to:
```yaml
responses:
  '200':
    description: Successful response
    content:
      application/json:
        schema:
          "$ref": "#/components/schemas/tag"
```

### Error Responses

```ruby
raise Api::V3::Errors::ApiCodedError.new(
  status: 404,
  type: Api::V3::Errors::Code::NOT_FOUND,
  message: "Resource Not Found"
)
```

Maps to:
```yaml
'404':
  description: Resource not found
  content:
    application/json:
      examples:
        Resource not found:
          value:
            type: error.list
            request_id: <uuid>
            errors:
            - code: not_found
              message: Resource Not Found
      schema:
        "$ref": "#/components/schemas/error"
```

### Common Error Codes

| Ruby Error Code | OpenAPI `code` value | HTTP Status |
|---|---|---|
| `NOT_FOUND` | `not_found` | 404 |
| `UNAUTHORIZED` | `unauthorized` | 401 |
| `PARAMETER_INVALID` | `parameter_invalid` | 400 |
| `PARAMETER_NOT_FOUND` | `parameter_not_found` | 400 |
| `INTERCOM_VERSION_INVALID` | `intercom_version_invalid` | 400 |
| `FORBIDDEN` | `forbidden` | 403 |
| `UNPROCESSABLE_ENTITY` | `unprocessable_entity` | 422 |

## Multiple Request Body Shapes (oneOf)

When a single endpoint accepts different request body formats (e.g., POST `/tags` can create a tag, tag companies, untag companies, or tag users), use `oneOf`:

```ruby
# Controller accepts different params depending on the operation
def create
  if params[:companies]
    # tag/untag companies
  elsif params[:users]
    # tag users
  else
    # create/update tag
  end
end
```

Maps to:
```yaml
requestBody:
  content:
    application/json:
      schema:
        oneOf:
        - "$ref": "#/components/schemas/create_or_update_tag_request"
        - "$ref": "#/components/schemas/tag_company_request"
        - "$ref": "#/components/schemas/untag_company_request"
        - "$ref": "#/components/schemas/tag_multiple_users_request"
      examples:
        create_tag:
          summary: Create a tag
          value:
            name: test
        tag_company:
          summary: Tag a company
          value:
            name: test
            companies:
            - company_id: '123'
```

## Adding a Field to an Existing Schema

The most common change type. Requires updates in TWO places:

1. **Add the property to `components/schemas/<schema>/properties`**
2. **Update ALL inline response examples** that return this schema

To find all affected examples, search for `schemas/<name>` in the spec:
```bash
grep -n 'schemas/ticket' descriptions/0/api.intercom.io.yaml
```

Then check each endpoint that references that schema `$ref` and add the new field value to its inline examples.
