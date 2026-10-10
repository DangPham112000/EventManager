// TODO: Define full GraphQL Schema
export const typeDefs = `#graphql
  type User {
    id: ID!
    email: String!
    name: String!
    avatar: String
    googleId: String
  }

  enum Participation {
    JOINED
    INTERESTED
  }

  type Attendee {
    user: User!
    participation: Participation!
  }

  type Event {
    id: ID!
    title: String!
    description: String
    startTime: String!
    endTime: String!
    location: String
    "The signed-in user's participation, or null if they are not an attendee."
    participation: Participation
    creator: User!
    "Everyone taking part, including the creator."
    attendees: [Attendee!]!
    googleEventId: String
    "Whether the signed-in user created this event, so may edit or delete it."
    isOwner: Boolean!
    "Token for a link that lets other users open and join the event. Only attendees can read it."
    shareToken: String
  }

  input CreateEventInput {
    title: String!
    description: String
    startTime: String!
    endTime: String!
    location: String
    participation: Participation
  }

  input UpdateEventInput {
    title: String
    description: String
    startTime: String
    endTime: String
    location: String
    "Changes the creator's own participation."
    participation: Participation
  }

  "Personal key an AI agent uses to call the MCP endpoint."
  type ApiKey {
    id: ID!
    name: String!
    "First characters of the key, for telling keys apart."
    prefix: String!
    createdAt: String!
    lastUsedAt: String
  }

  type CreatedApiKey {
    "The full key. Shown only once."
    key: String!
    apiKey: ApiKey!
  }

  type Query {
    me: User
    getEvents: [Event!]!
    "An event the user created or attends, or any event when the matching shareToken is given."
    getEvent(id: ID!, shareToken: String): Event
    apiKeys: [ApiKey!]!
  }

  type Mutation {
    createEvent(input: CreateEventInput!): Event!
    updateEvent(id: ID!, input: UpdateEventInput!): Event!
    deleteEvent(id: ID!): Boolean!
    "Join an event (shareToken needed unless already attending), or change the user's participation."
    joinEvent(eventId: ID!, participation: Participation = JOINED, shareToken: String): Event!
    "Leave an event. The creator cannot leave their own event."
    leaveEvent(eventId: ID!): Event!
    createApiKey(name: String!): CreatedApiKey!
    revokeApiKey(id: ID!): Boolean!
  }
`;
