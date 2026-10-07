import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client/core';

// Dev talks to the local backend; the production build uses same-origin
// "/graphql", which the frontend nginx proxies to the backend container.
const httpLink = new HttpLink({
  uri:
    import.meta.env.VITE_GRAPHQL_URL ||
    (import.meta.env.DEV ? 'http://localhost:4000/graphql' : '/graphql'),
});

export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          getEvents: {
            // Replace entire list on refetch (no merging needed for simple use case)
            merge: false,
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});
