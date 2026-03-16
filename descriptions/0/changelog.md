## `GET /data_connectors/{id}` schema corrected
Fixed response schema for the data connector show endpoint to use `present_detail` fields: added `data_inputs`, `response_fields`, `object_mappings`, `audiences`, `execution_type`, `token_ids`, `customer_authentication`, `bypass_authentication`, and `validate_missing_attributes`. Also added optional `state_version` query parameter (`live`/`draft`). Introduced `data_connector_detail` schema.

## `GET /data_connectors/{id}` added
Added missing show endpoint for retrieving a single data connector by ID.

## `GET /messages/whatsapp/status` added
Added missing endpoint for checking WhatsApp message delivery status.
