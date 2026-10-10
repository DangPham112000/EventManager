import { gql } from '@apollo/client/core';

export const ME_QUERY = gql`
  query Me {
    me {
      id
      email
      name
      avatar
      googleId
    }
  }
`;

export const GET_EVENTS = gql`
  query GetEvents {
    getEvents {
      id
      title
      description
      startTime
      endTime
      location
      participation
      isOwner
      creator {
        id
        name
        avatar
      }
      attendees {
        user {
          id
          name
          avatar
        }
        participation
      }
    }
  }
`;

export const GET_EVENT = gql`
  query GetEvent($id: ID!, $shareToken: String) {
    getEvent(id: $id, shareToken: $shareToken) {
      id
      title
      description
      startTime
      endTime
      location
      participation
      isOwner
      creator {
        id
        name
        email
        avatar
      }
      attendees {
        user {
          id
          name
          email
          avatar
        }
        participation
      }
      shareToken
    }
  }
`;

export const GET_API_KEYS = gql`
  query ApiKeys {
    apiKeys {
      id
      name
      prefix
      createdAt
      lastUsedAt
    }
  }
`;
