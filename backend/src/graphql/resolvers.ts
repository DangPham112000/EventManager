// TODO: Implement full GraphQL Resolvers
export const resolvers = {
  Query: {
    me: () => {
      // TODO: Implement
      return null;
    },
    getEvents: () => {
      // TODO: Implement
      return [];
    },
    getEvent: (_: any, { id }: { id: string }) => {
      // TODO: Implement
      return null;
    },
  },
  Mutation: {
    // TODO: Implement mutations
  },
};
