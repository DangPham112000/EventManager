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

  type Event {
    id: ID!
    title: String!
    description: String
    startTime: String!
    endTime: String!
    location: String
    participation: Participation!
    creator: User!
    attendees: [User!]!
    googleEventId: String
    "Whether the signed-in user created this event, so may edit or delete it."
    isOwner: Boolean!
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
    getEvent(id: ID!): Event
    apiKeys: [ApiKey!]!
  }

  type Mutation {
    createEvent(input: CreateEventInput!): Event!
    updateEvent(id: ID!, input: UpdateEventInput!): Event!
    deleteEvent(id: ID!): Boolean!
    createApiKey(name: String!): CreatedApiKey!
    revokeApiKey(id: ID!): Boolean!
  }
`;
