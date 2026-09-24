import type { IUser, IEvent } from './types.js';

/**
 * Seeded user for single-user mode.
 * When multi-user is added, this will be replaced by DB lookup.
 */
export const SEED_USER: IUser = {
  id: 'user-001',
  email: 'dangpham@example.com',
  name: 'Dang Pham',
  avatar: undefined,
  googleId: 'google-mock-001',
};

/**
 * Helper: generate a date relative to today.
 * @param dayOffset - days from today (0 = today)
 * @param hour - hour of day (0-23)
 * @param minute - minute (0-59)
 */
function relativeDate(dayOffset: number, hour: number, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

/**
 * Sample events spanning this week and next week.
 * IDs use simple string format for easy debugging.
 */
export const SEED_EVENTS: IEvent[] = [
  {
    id: 'evt-001',
    title: 'Team Standup',
    description: 'Daily standup with the dev team. Review yesterday\'s progress and today\'s plan.',
    startTime: relativeDate(0, 9, 0),
    endTime: relativeDate(0, 9, 30),
    location: 'Meeting Room A',
    creator: SEED_USER,
    attendees: [SEED_USER],
  },
  {
    id: 'evt-002',
    title: 'Design Review',
    description: 'Review new dashboard mockups with the design team.',
    startTime: relativeDate(0, 14, 0),
    endTime: relativeDate(0, 15, 30),
    location: 'Conference Room B',
    creator: SEED_USER,
    attendees: [SEED_USER],
  },
  {
    id: 'evt-003',
    title: 'Lunch with Client',
    description: 'Discuss project milestones over lunch.',
    startTime: relativeDate(1, 12, 0),
    endTime: relativeDate(1, 13, 0),
    location: 'Pho Nguyen Restaurant',
    creator: SEED_USER,
    attendees: [SEED_USER],
  },
  {
    id: 'evt-004',
    title: 'Sprint Planning',
    description: 'Plan the next 2-week sprint. Prioritize backlog items.',
    startTime: relativeDate(1, 10, 0),
    endTime: relativeDate(1, 11, 30),
    location: 'Meeting Room A',
    creator: SEED_USER,
    attendees: [SEED_USER],
  },
  {
    id: 'evt-005',
    title: 'Code Review Session',
    description: 'Review PRs for the event manager feature.',
    startTime: relativeDate(2, 15, 0),
    endTime: relativeDate(2, 16, 0),
    creator: SEED_USER,
    attendees: [SEED_USER],
  },
  {
    id: 'evt-006',
    title: 'Yoga Class',
    description: 'Weekly yoga session. Don\'t forget your mat!',
    startTime: relativeDate(2, 18, 0),
    endTime: relativeDate(2, 19, 0),
    location: 'Fitness Center',
    creator: SEED_USER,
    attendees: [SEED_USER],
  },
  {
    id: 'evt-007',
    title: 'Product Demo',
    description: 'Demo the latest build to stakeholders.',
    startTime: relativeDate(3, 11, 0),
    endTime: relativeDate(3, 12, 0),
    location: 'Main Auditorium',
    creator: SEED_USER,
    attendees: [SEED_USER],
  },
  {
    id: 'evt-008',
    title: 'One-on-One with Manager',
    description: 'Monthly check-in. Bring career development topics.',
    startTime: relativeDate(3, 16, 0),
    endTime: relativeDate(3, 16, 30),
    creator: SEED_USER,
    attendees: [SEED_USER],
  },
  {
    id: 'evt-009',
    title: 'Tech Talk: GraphQL Best Practices',
    description: 'Internal presentation on GraphQL schema design and performance.',
    startTime: relativeDate(4, 14, 0),
    endTime: relativeDate(4, 15, 0),
    location: 'Online — Google Meet',
    creator: SEED_USER,
    attendees: [SEED_USER],
  },
  {
    id: 'evt-010',
    title: 'Team Happy Hour',
    description: 'Casual drinks and games with the team 🎉',
    startTime: relativeDate(5, 17, 0),
    endTime: relativeDate(5, 19, 0),
    location: 'Rooftop Bar',
    creator: SEED_USER,
    attendees: [SEED_USER],
  },
  {
    id: 'evt-011',
    title: 'Weekend Hackathon',
    description: 'Build something cool in 24 hours!',
    startTime: relativeDate(6, 9, 0),
    endTime: relativeDate(6, 18, 0),
    location: 'Co-working Space',
    creator: SEED_USER,
    attendees: [SEED_USER],
  },
  {
    id: 'evt-012',
    title: 'Dentist Appointment',
    description: 'Regular checkup.',
    startTime: relativeDate(7, 8, 0),
    endTime: relativeDate(7, 9, 0),
    location: 'Dental Clinic',
    creator: SEED_USER,
    attendees: [SEED_USER],
  },
];
