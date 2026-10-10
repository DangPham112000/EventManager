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
| `participation` | `Participation` | ❌  | The signed-in user's own participation (`JOINED` or `INTERESTED`), or null if they are not an attendee; their interested events are ignored by conflict checks |
| `creator`       | `User!`    | ✅       | User who created the event          |
| `attendees`     | `[Attendee!]!` | ✅   | Everyone taking part, including the creator, each with their own participation |
| `googleEventId` | `String`   | ❌       | Google Calendar sync reference ID   |
| `isOwner`       | `Boolean!` | ✅       | Whether the signed-in user created the event |
| `shareToken`    | `String`   | ❌       | Token for the invite link (`/events/:id?share=...`); only attendees receive it |

### Attendee
| Field           | Type             | Required | Description                     |
|-----------------|------------------|----------|---------------------------------|
| `user`          | `User!`          | ✅       | The attendee                    |
| `participation` | `Participation!` | ✅       | `JOINED` or `INTERESTED`        |

## Queries

| Query                  | Return Type  | Description                          |
|------------------------|--------------|--------------------------------------|
| `me`                   | `User`       | Get current logged-in user profile   |
| `getEvents`            | `[Event!]!`  | Events the user created or attends   |
| `getEvent(id: ID!, shareToken: String)` | `Event` | An event the user created or attends, or any event with its share token |
| `apiKeys`              | `[ApiKey!]!` | Current user's MCP API keys          |

## Mutations

| Mutation                                    | Return Type    | Description                          |
|---------------------------------------------|----------------|--------------------------------------|
| `loginWithGoogle(token: String!)`            | `AuthPayload`  | Handle Google login/registration     |
| `createEvent(input: CreateEventInput!)`      | `Event!`       | Create a new event                   |
| `updateEvent(id: ID!, input: UpdateEventInput!)` | `Event!`  | Update an existing event             |
| `deleteEvent(id: ID!)`                       | `Boolean!`     | Delete an event                      |
| `joinEvent(eventId: ID!, participation: Participation = JOINED, shareToken: String)` | `Event!` | Join an event (share token needed unless already attending) or change the user's participation |
| `leaveEvent(eventId: ID!)`                   | `Event!`       | Leave an event (not allowed for its creator) |
| `createApiKey(name: String!)`                | `CreatedApiKey!` | Create an MCP API key (raw key returned once) |
| `revokeApiKey(id: ID!)`                      | `Boolean!`     | Revoke one of the user's API keys    |

## MCP endpoint

`POST /mcp` (Streamable HTTP, stateless), authenticated with `Authorization: Bearer emk_...` or `?key=emk_...`.
Tools: `list_events`, `get_event`, `check_availability`, `find_conflicts`, `create_event`, `update_event`, `delete_event`.
