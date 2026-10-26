// Run with `pnpm --filter backend test`. Uses the in-memory mock data source.
process.env.USE_MOCK = 'true';

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ApolloServer } from '@apollo/server';
import { typeDefs } from '../src/graphql/typeDefs.js';
import { resolvers, type Context } from '../src/graphql/resolvers.js';
import { SEED_USER } from '../src/data/mockData.js';

const server = new ApolloServer<Context>({ typeDefs, resolvers });

async function run(query: string, fromOtherApp: boolean) {
  const res = await server.executeOperation({ query }, { contextValue: { user: SEED_USER, fromOtherApp } });
  if (res.body.kind !== 'single') throw new Error('unexpected incremental response');
  return res.body.singleResult;
}

const codeOf = (result: Awaited<ReturnType<typeof run>>) => result.errors?.[0]?.extensions?.code;

test('tokens from other apps cannot touch API keys or calendar sharing', async () => {
  for (const query of [
    '{ apiKeys { id } }',
    '{ calendarShare { enabled } }',
    'mutation { createApiKey(name: "x") { key } }',
    'mutation { revokeApiKey(id: "x") }',
    'mutation { updateCalendarShare(enabled: true) { enabled } }',
    'mutation { regenerateCalendarShareToken { token } }',
  ]) {
    assert.equal(codeOf(await run(query, true)), 'FORBIDDEN', query);
  }
});

test('tokens from other apps can read events and conflicts', async () => {
  const events = await run('{ getEvents { id } }', true);
  assert.equal(events.errors, undefined);
  const conflicts = await run(
    '{ conflicts(startTime: "2026-10-26T09:15:00Z", endTime: "2026-10-26T09:20:00Z") { id } }',
    true,
  );
  assert.equal(conflicts.errors, undefined);
});

test('Event Manager itself can still read its calendar share', async () => {
  assert.equal((await run('{ calendarShare { enabled } }', false)).errors, undefined);
});
