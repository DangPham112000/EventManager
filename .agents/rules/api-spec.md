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
| `creator`       | `User!`    | ✅       | User who created the event          |
| `attendees`     | `[User!]!` | ✅       | List of participating users         |
| `googleEventId` | `String`   | ❌       | Google Calendar sync reference ID   |

## Queries

| Query                  | Return Type  | Description                          |
|------------------------|--------------|--------------------------------------|
| `me`                   | `User`       | Get current logged-in user profile   |
| `getEvents`            | `[Event!]!`  | Get a list of all events             |
| `getEvent(id: ID!)`    | `Event`      | Get details of a specific event      |

## Mutations

| Mutation                                    | Return Type    | Description                          |
|---------------------------------------------|----------------|--------------------------------------|
| `loginWithGoogle(token: String!)`            | `AuthPayload`  | Handle Google login/registration     |
| `createEvent(input: CreateEventInput!)`      | `Event!`       | Create a new event                   |
| `updateEvent(id: ID!, input: UpdateEventInput!)` | `Event!`  | Update an existing event             |
| `deleteEvent(id: ID!)`                       | `Boolean!`     | Delete an event                      |
| `joinEvent(eventId: ID!)`                    | `Event!`       | Join/participate in an event         |
| `leaveEvent(eventId: ID!)`                   | `Event!`       | Leave an event                       |
