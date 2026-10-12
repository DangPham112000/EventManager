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
    "Icon key shown before the title (see EVENT_ICONS), or null when none was picked."
    icon: String
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
    icon: String
    participation: Participation
  }

  input UpdateEventInput {
    title: String
    description: String
    startTime: String
    endTime: String
    location: String
    "An icon key, or null to remove the icon."
    icon: String
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

  enum CalendarShareMode {
    "People with the link see when the owner is busy, but no event details."
    PRIVATE
    "People with the link see every event's details."
    PUBLIC
  }

  "The signed-in user's read-only calendar link."
  type CalendarShare {
    enabled: Boolean!
    mode: CalendarShareMode!
    "Secret in the link (/share/:token); null until sharing is first turned on."
    token: String
  }

  "One event as a share link shows it. In PRIVATE mode the title is Busy and the other fields are null."
  type SharedEvent {
    id: ID!
    title: String!
    startTime: String!
    endTime: String!
    description: String
    location: String
    icon: String
    "The owner's participation."
    participation: Participation
  }

  type SharedCalendar {
    ownerName: String!
    mode: CalendarShareMode!
    events: [SharedEvent!]!
  }

  type Query {
    me: User
    getEvents: [Event!]!
    "An event the user created or attends, or any event when the matching shareToken is given."
    getEvent(id: ID!, shareToken: String): Event
    apiKeys: [ApiKey!]!
    calendarShare: CalendarShare!
    "The calendar behind a share link. Needs no sign-in; null when the link is unknown or sharing is off."
    sharedCalendar(token: String!): SharedCalendar
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
    "Turn calendar sharing on or off, or change its mode."
    updateCalendarShare(enabled: Boolean, mode: CalendarShareMode): CalendarShare!
    "Replace the share link; the old link stops working."
    regenerateCalendarShareToken: CalendarShare!
  }
`;
