// Run with `pnpm --filter backend test`. Uses the in-memory mock data source.
process.env.USE_MOCK = 'true';

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ApolloServer } from '@apollo/server';
import { typeDefs } from '../src/graphql/typeDefs.js';
import { resolvers, type Context } from '../src/graphql/resolvers.js';
import { BUSY_TITLE, toSharedEvent } from '../src/calendarShare.js';
import { OTHER_USER, SEED_EVENTS, SEED_USER } from '../src/data/mockData.js';
import type { IEvent } from '../src/data/types.js';

const server = new ApolloServer<Context>({ typeDefs, resolvers });

async function run(query: string, variables: Record<string, unknown>, user: Context['user']) {
  const res = await server.executeOperation({ query, variables }, { contextValue: { user, fromOtherApp: false } });
  assert.equal(res.body.kind, 'single');
  if (res.body.kind !== 'single') throw new Error('unexpected incremental response');
  return res.body.singleResult;
}

const UPDATE = `mutation ($enabled: Boolean, $mode: CalendarShareMode) {
  updateCalendarShare(enabled: $enabled, mode: $mode) { enabled mode token }
}`;
const REGENERATE = `mutation { regenerateCalendarShareToken { enabled mode token } }`;
const SHARED = `query ($token: String!) {
  sharedCalendar(token: $token) {
    ownerName mode
    events { id title startTime endTime description location icon participation }
  }
}`;

const ownEvents = SEED_EVENTS.filter(
  (e) => e.creator.id === SEED_USER.id || e.attendees.some((a) => a.user.id === SEED_USER.id),
);

/** Strings that must never reach a viewer of a PRIVATE link. */
function secretsOf(events: IEvent[]): string[] {
  return events.flatMap((e) =>
    [e.id, e.title, e.description, e.location, e.icon, e.shareToken, ...e.attendees.map((a) => a.user.email)].filter(
      (s): s is string => !!s && s !== BUSY_TITLE,
    ),
  );
}

test('toSharedEvent hides everything but the time in PRIVATE mode', () => {
  const event: IEvent = {
    id: 'evt-secret',
    title: 'Doctor appointment',
    description: 'Blood test',
    location: 'City Hospital',
    icon: 'hospital',
    startTime: '2026-10-12T02:00:00.000Z',
    endTime: '2026-10-12T03:00:00.000Z',
    creator: SEED_USER,
    attendees: [
      { user: SEED_USER, participation: 'INTERESTED' },
      { user: OTHER_USER, participation: 'JOINED' },
    ],
    shareToken: 'event-share-token',
  };

  assert.deepEqual(toSharedEvent(event, SEED_USER.id, 'PRIVATE', 3), {
    id: 'busy-3',
    title: BUSY_TITLE,
    startTime: event.startTime,
    endTime: event.endTime,
    description: null,
    location: null,
    icon: null,
    participation: null,
  });

  assert.deepEqual(toSharedEvent(event, SEED_USER.id, 'PUBLIC', 3), {
    id: 'evt-secret',
    title: 'Doctor appointment',
    startTime: event.startTime,
    endTime: event.endTime,
    description: 'Blood test',
    location: 'City Hospital',
    icon: 'hospital',
    participation: 'INTERESTED',
  });
});

test('share links: off by default, PRIVATE masks data server-side, PUBLIC shows it, regenerate revokes', async () => {
  // Signed-out users cannot change sharing.
  const anonymous = await run(UPDATE, { enabled: true }, null);
  assert.equal(anonymous.errors?.[0].extensions?.code, 'UNAUTHENTICATED');

  const initial = await run(`query { calendarShare { enabled mode token } }`, {}, SEED_USER);
  assert.deepEqual({ ...(initial.data as any).calendarShare }, { enabled: false, mode: 'PRIVATE', token: null });

  // Turning sharing on makes a link, PRIVATE by default.
  const enabled = await run(UPDATE, { enabled: true }, SEED_USER);
  assert.equal(enabled.errors, undefined);
  const share = (enabled.data as any).updateCalendarShare;
  assert.equal(share.enabled, true);
  assert.equal(share.mode, 'PRIVATE');
  assert.ok(share.token && share.token.length >= 32, 'token should be long and random');

  // A viewer with the link, not signed in, sees busy blocks only.
  const privateRes = await run(SHARED, { token: share.token }, null);
  assert.equal(privateRes.errors, undefined);
  const privateCal = (privateRes.data as any).sharedCalendar;
  assert.equal(privateCal.mode, 'PRIVATE');
  assert.equal(privateCal.ownerName, SEED_USER.name);
  assert.equal(privateCal.events.length, ownEvents.length);
  for (const e of privateCal.events) {
    assert.equal(e.title, BUSY_TITLE);
    assert.equal(e.description, null);
    assert.equal(e.location, null);
    assert.equal(e.icon, null);
    assert.equal(e.participation, null);
  }
  const body = JSON.stringify(privateRes);
  for (const secret of secretsOf(ownEvents)) {
    assert.ok(!body.includes(secret), `PRIVATE response leaked "${secret}"`);
  }
  assert.ok(!body.includes(SEED_USER.email), 'PRIVATE response leaked the owner email');

  // PUBLIC shows the details, still without anyone's email.
  const toPublic = await run(UPDATE, { mode: 'PUBLIC' }, SEED_USER);
  assert.equal((toPublic.data as any).updateCalendarShare.token, share.token, 'changing mode keeps the link');
  const publicRes = await run(SHARED, { token: share.token }, null);
  const publicCal = (publicRes.data as any).sharedCalendar;
  assert.equal(publicCal.mode, 'PUBLIC');
  assert.deepEqual(
    publicCal.events.map((e: any) => e.title).sort(),
    ownEvents.map((e) => e.title).sort(),
  );
  const withLocation = ownEvents.find((e) => e.location)!;
  assert.equal(publicCal.events.find((e: any) => e.id === withLocation.id).location, withLocation.location);
  assert.ok(!JSON.stringify(publicRes).includes(SEED_USER.email));

  // A new link revokes the old one.
  const regenerated = (await run(REGENERATE, {}, SEED_USER)).data as any;
  const newToken = regenerated.regenerateCalendarShareToken.token;
  assert.notEqual(newToken, share.token);
  assert.equal(((await run(SHARED, { token: share.token }, null)).data as any).sharedCalendar, null);
  assert.notEqual(((await run(SHARED, { token: newToken }, null)).data as any).sharedCalendar, null);

  // Turning sharing off disables the link; turning it back on reuses it.
  await run(UPDATE, { enabled: false }, SEED_USER);
  assert.equal(((await run(SHARED, { token: newToken }, null)).data as any).sharedCalendar, null);
  const again = (await run(UPDATE, { enabled: true }, SEED_USER)).data as any;
  assert.equal(again.updateCalendarShare.token, newToken);

  // Unknown tokens reveal nothing.
  assert.equal(((await run(SHARED, { token: 'not-a-token' }, null)).data as any).sharedCalendar, null);
  assert.equal(((await run(SHARED, { token: '' }, null)).data as any).sharedCalendar, null);
});
