import { gql } from '@apollo/client/core';

export const CREATE_EVENT = gql`
  mutation CreateEvent($input: CreateEventInput!) {
    createEvent(input: $input) {
      id
      title
      description
      startTime
      endTime
      location
      participation
      creator {
        id
        name
      }
      isOwner
      attendees {
        user {
          id
          name
        }
        participation
      }
    }
  }
`;

export const UPDATE_EVENT = gql`
  mutation UpdateEvent($id: ID!, $input: UpdateEventInput!) {
    updateEvent(id: $id, input: $input) {
      id
      title
      description
      startTime
      endTime
      location
      participation
      creator {
        id
        name
      }
      isOwner
      attendees {
        user {
          id
          name
        }
        participation
      }
    }
  }
`;

// Both return the fields that change when the user joins or leaves, so the cached event stays current.
export const JOIN_EVENT = gql`
  mutation JoinEvent($eventId: ID!, $participation: Participation, $shareToken: String) {
    joinEvent(eventId: $eventId, participation: $participation, shareToken: $shareToken) {
      id
      participation
      shareToken
      attendees {
        user {
          id
          name
          email
          avatar
        }
        participation
      }
    }
  }
`;

export const LEAVE_EVENT = gql`
  mutation LeaveEvent($eventId: ID!) {
    leaveEvent(eventId: $eventId) {
      id
      participation
      shareToken
      attendees {
        user {
          id
          name
          email
          avatar
        }
        participation
      }
    }
  }
`;

export const DELETE_EVENT = gql`
  mutation DeleteEvent($id: ID!) {
    deleteEvent(id: $id)
  }
`;

export const CREATE_API_KEY = gql`
  mutation CreateApiKey($name: String!) {
    createApiKey(name: $name) {
      key
      apiKey {
        id
        name
        prefix
        createdAt
        lastUsedAt
      }
    }
  }
`;

export const REVOKE_API_KEY = gql`
  mutation RevokeApiKey($id: ID!) {
    revokeApiKey(id: $id)
  }
`;
