# Event Manager — API Specification (GraphQL)

## Entities

### User
| Field      | Type     | Required | Description         |
|------------|----------|----------|---------------------|
| `id`       | `ID!`    | ✅       | Unique identifier   |
| `email`    | `String!`| ✅       | User email address  |
| `name`     | `String!`| ✅       | Display name        |
| `avatar`   | `String` | ❌       | Profile avatar URL  |
| `googleId` | `String!`| ✅       | Google OAuth ID     |

### Event
| Field           | Type       | Required | Description                         |
|-----------------|------------|----------|-------------------------------------|
| `id`            | `ID!`      | ✅       | Unique identifier                   |
| `title`         | `String!`  | ✅       | Event title                         |
| `description`   | `String`   | ❌       | Event description                   |
| `startTime`     | `String!`  | ✅       | Start time (ISO 8601)               |
| `endTime`       | `String!`  | ✅       | End time (ISO 8601)                 |
| `location`      | `String`   | ❌       | Event location                      |
| `participation` | `Participation!` | ✅ | `JOINED` (default) or `INTERESTED`; interested events are ignored by conflict checks |
| `creator`       | `User!`    | ✅       | User who created the event          |
| `attendees`     | `[User!]!` | ✅       | List of participating users         |
| `googleEventId` | `String`   | ❌       | Google Calendar sync reference ID   |

## Queries

| Query                  | Return Type  | Description                          |
|------------------------|--------------|--------------------------------------|
| `me`                   | `User`       | Get current logged-in user profile   |
| `getEvents`            | `[Event!]!`  | Get a list of all events             |
| `getEvent(id: ID!)`    | `Event`      | Get details of a specific event      |
| `apiKeys`              | `[ApiKey!]!` | Current user's MCP API keys          |

## Mutations

| Mutation                                    | Return Type    | Description                          |
|---------------------------------------------|----------------|--------------------------------------|
| `loginWithGoogle(token: String!)`            | `AuthPayload`  | Handle Google login/registration     |
| `createEvent(input: CreateEventInput!)`      | `Event!`       | Create a new event                   |
| `updateEvent(id: ID!, input: UpdateEventInput!)` | `Event!`  | Update an existing event             |
| `deleteEvent(id: ID!)`                       | `Boolean!`     | Delete an event                      |
| `joinEvent(eventId: ID!)`                    | `Event!`       | Join/participate in an event         |
| `leaveEvent(eventId: ID!)`                   | `Event!`       | Leave an event                       |
| `createApiKey(name: String!)`                | `CreatedApiKey!` | Create an MCP API key (raw key returned once) |
| `revokeApiKey(id: ID!)`                      | `Boolean!`     | Revoke one of the user's API keys    |

## MCP endpoint

`POST /mcp` (Streamable HTTP, stateless), authenticated with `Authorization: Bearer emk_...` or `?key=emk_...`.
Tools: `list_events`, `get_event`, `check_availability`, `find_conflicts`, `create_event`, `update_event`, `delete_event`.
