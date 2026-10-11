/**
 * Icons an event can show before its title. The frontend draws each key and
 * suggests one from the title when an event has none; keep the two lists in
 * sync (frontend/src/lib/eventIcons.ts).
 */
export const EVENT_ICONS = {
  none: 'No icon',
  plane: 'Trip abroad or flight',
  'trail-run': 'Trail running',
  run: 'Running',
  triathlon: 'Triathlon, duathlon or aquathlon',
  dive: 'Diving or snorkeling',
  swim: 'Swimming',
  bike: 'Cycling',
  hike: 'Hiking or trekking',
  ski: 'Skiing or snowboarding',
  gym: 'Gym or workout',
  yoga: 'Yoga or meditation',
  football: 'Football or other ball sports',
  race: 'Race, tournament or award',
  beach: 'Beach or sea trip',
  camping: 'Camping',
  car: 'Road trip or driving',
  meeting: 'Meeting',
  work: 'Work',
  study: 'Class, course or exam',
  food: 'Meal',
  coffee: 'Coffee',
  party: 'Party',
  birthday: 'Birthday',
  music: 'Music or concert',
  movie: 'Movie',
  health: 'Doctor or health check',
  family: 'Family',
  shopping: 'Shopping',
} as const;

export type EventIcon = keyof typeof EVENT_ICONS;

export const EVENT_ICON_KEYS = Object.keys(EVENT_ICONS) as [EventIcon, ...EventIcon[]];

export function isEventIcon(value: string): value is EventIcon {
  return Object.hasOwn(EVENT_ICONS, value);
}
