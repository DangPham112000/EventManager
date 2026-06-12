// TODO: Define full GraphQL Schema
export const typeDefs = `#graphql
  type User {
    id: ID!
    email: String!
    name: String!
    avatar: String
    googleId: String!
  }

  type Event {
    id: ID!
    title: String!
    description: String
    startTime: String!
    endTime: String!
    location: String
    creator: User!
    attendees: [User!]!
    googleEventId: String
  }

  type Query {
    me: User
    getEvents: [Event!]!
    getEvent(id: ID!): Event
  }

  type Mutation {
    _empty: String
  }
`;
