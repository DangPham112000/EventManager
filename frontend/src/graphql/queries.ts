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
      creator {
        id
        name
        avatar
      }
      attendees {
        id
        name
        avatar
      }
    }
  }
`;

export const GET_EVENT = gql`
  query GetEvent($id: ID!) {
    getEvent(id: $id) {
      id
      title
      description
      startTime
      endTime
      location
      creator {
        id
        name
        email
        avatar
      }
      attendees {
        id
        name
        email
        avatar
      }
    }
  }
`;
