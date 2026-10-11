import {
  mdiAccountGroup,
  mdiAirplane,
  mdiBeach,
  mdiBike,
  mdiBriefcase,
  mdiCakeVariant,
  mdiCar,
  mdiCart,
  mdiCoffee,
  mdiDivingScuba,
  mdiDumbbell,
  mdiHiking,
  mdiHomeHeart,
  mdiImageFilterHdr,
  mdiMovieOpen,
  mdiMusic,
  mdiPartyPopper,
  mdiRun,
  mdiSchool,
  mdiSilverwareForkKnife,
  mdiSki,
  mdiSoccer,
  mdiStethoscope,
  mdiSwim,
  mdiTent,
  mdiTrophy,
  mdiYoga,
} from '@mdi/js';

/** One SVG path in a 24×24 box, optionally moved/scaled to share the box with others. */
export interface IconLayer {
  path: string;
  transform?: string;
}

export interface EventIconDef {
  label: string;
  layers: IconLayer[];
  /**
   * Lower-case words or phrases that suggest this icon when found in an
   * event's title (or, failing that, its location or description).
   */
  keywords: string[];
}

/**
 * Icons an event can show before its title. Keys are stored on the event;
 * keep them in sync with backend/src/icons.ts. Order matters for
 * suggestions: more specific icons come before general ones (trail running
 * before running, triathlon before swimming).
 */
export const EVENT_ICONS = {
  'trail-run': {
    label: 'Trail running',
    layers: [
      // A runner on a mountain ridge.
      { path: mdiImageFilterHdr, transform: 'translate(0 6) scale(1 0.75)' },
      { path: mdiRun, transform: 'translate(6 -1) scale(0.6)' },
    ],
    keywords: ['trail', 'chạy trail', 'chạy núi', 'núi dinh', 'ultra', 'vmm', 'skyrace', 'vertical'],
  },
  triathlon: {
    label: 'Triathlon',
    layers: [
      { path: mdiSwim, transform: 'translate(0 12) scale(0.5)' },
      { path: mdiBike, transform: 'translate(12 12) scale(0.5)' },
      { path: mdiRun, transform: 'translate(6 0) scale(0.5)' },
    ],
    keywords: ['triathlon', 'duathlon', 'aquathlon', 'ironman', 'ba môn', 'phối hợp'],
  },
  dive: {
    label: 'Diving',
    layers: [{ path: mdiDivingScuba }],
    keywords: ['lặn', 'dive', 'diving', 'scuba', 'snorkel', 'snorkeling', 'freedive', 'freediving'],
  },
  run: {
    label: 'Running',
    layers: [{ path: mdiRun }],
    keywords: ['chạy', 'chạy bộ', 'run', 'running', 'marathon', 'half marathon', '5k', '10k', '21k', '42k', 'jogging'],
  },
  swim: {
    label: 'Swimming',
    layers: [{ path: mdiSwim }],
    keywords: ['bơi', 'swim', 'swimming', 'hồ bơi', 'pool'],
  },
  bike: {
    label: 'Cycling',
    layers: [{ path: mdiBike }],
    keywords: ['đạp xe', 'xe đạp', 'bike', 'cycling', 'biking'],
  },
  ski: {
    label: 'Skiing',
    layers: [{ path: mdiSki }],
    keywords: ['trượt tuyết', 'ski', 'skiing', 'snowboard', 'snowboarding'],
  },
  hike: {
    label: 'Hiking',
    layers: [{ path: mdiHiking }],
    keywords: ['leo núi', 'trekking', 'trek', 'hike', 'hiking', 'đi bộ đường dài'],
  },
  plane: {
    label: 'Trip abroad',
    layers: [{ path: mdiAirplane }],
    keywords: [
      'flight', 'chuyến bay', 'sân bay', 'airport', 'du lịch', 'chuyến đi', 'trip', 'travel', 'nước ngoài',
      'bangkok', 'thái lan', 'thailand', 'trung quốc', 'china', 'nhật bản', 'japan', 'hàn quốc', 'korea',
      'singapore', 'malaysia', 'đài loan', 'taiwan', 'hồng kông', 'hong kong', 'châu âu', 'europe', 'úc', 'australia',
    ],
  },
  beach: {
    label: 'Beach',
    layers: [{ path: mdiBeach }],
    keywords: ['biển', 'beach', 'tắm biển'],
  },
  camping: {
    label: 'Camping',
    layers: [{ path: mdiTent }],
    keywords: ['cắm trại', 'camping', 'camp', 'glamping'],
  },
  car: {
    label: 'Road trip',
    layers: [{ path: mdiCar }],
    keywords: ['road trip', 'roadtrip', 'lái xe', 'phượt'],
  },
  gym: {
    label: 'Workout',
    layers: [{ path: mdiDumbbell }],
    keywords: ['gym', 'workout', 'tập gym', 'tập luyện', 'fitness', 'crossfit'],
  },
  yoga: {
    label: 'Yoga',
    layers: [{ path: mdiYoga }],
    keywords: ['yoga', 'thiền', 'meditation', 'pilates'],
  },
  football: {
    label: 'Ball sports',
    layers: [{ path: mdiSoccer }],
    keywords: ['bóng đá', 'đá bóng', 'football', 'soccer', 'futsal', 'cầu lông', 'badminton', 'tennis', 'pickleball', 'bóng rổ', 'basketball'],
  },
  race: {
    label: 'Race / tournament',
    layers: [{ path: mdiTrophy }],
    keywords: ['race', 'tournament', 'championship', 'cup', 'award', 'trao giải'],
  },
  birthday: {
    label: 'Birthday',
    layers: [{ path: mdiCakeVariant }],
    keywords: ['sinh nhật', 'birthday', 'bday'],
  },
  party: {
    label: 'Party',
    layers: [{ path: mdiPartyPopper }],
    keywords: ['tiệc', 'party', 'liên hoan', 'happy hour', 'year end party', 'tất niên', 'gala'],
  },
  meeting: {
    label: 'Meeting',
    layers: [{ path: mdiAccountGroup }],
    keywords: ['họp', 'meeting', 'standup', 'review', 'planning', 'one-on-one', '1:1', 'demo', 'interview', 'phỏng vấn'],
  },
  study: {
    label: 'Study',
    layers: [{ path: mdiSchool }],
    keywords: ['học', 'class', 'course', 'khóa học', 'workshop', 'exam', 'seminar', 'webinar', 'hội thảo'],
  },
  work: {
    label: 'Work',
    layers: [{ path: mdiBriefcase }],
    keywords: ['work', 'công việc', 'deadline', 'office', 'hackathon', 'công tác'],
  },
  coffee: {
    label: 'Coffee',
    layers: [{ path: mdiCoffee }],
    keywords: ['cà phê', 'cafe', 'café', 'coffee'],
  },
  food: {
    label: 'Meal',
    layers: [{ path: mdiSilverwareForkKnife }],
    keywords: ['ăn', 'ăn tối', 'ăn trưa', 'lunch', 'dinner', 'breakfast', 'brunch', 'nhậu', 'buffet', 'bbq'],
  },
  music: {
    label: 'Music',
    layers: [{ path: mdiMusic }],
    keywords: ['concert', 'nhạc', 'music', 'live show', 'liveshow', 'festival', 'karaoke'],
  },
  movie: {
    label: 'Movie',
    layers: [{ path: mdiMovieOpen }],
    keywords: ['phim', 'movie', 'cinema', 'rạp'],
  },
  health: {
    label: 'Health',
    layers: [{ path: mdiStethoscope }],
    keywords: ['khám', 'bác sĩ', 'doctor', 'dentist', 'nha sĩ', 'bệnh viện', 'hospital', 'checkup', 'tiêm'],
  },
  family: {
    label: 'Family',
    layers: [{ path: mdiHomeHeart }],
    keywords: ['gia đình', 'family', 'về quê', 'đám cưới', 'wedding', 'giỗ'],
  },
  shopping: {
    label: 'Shopping',
    layers: [{ path: mdiCart }],
    keywords: ['mua sắm', 'shopping', 'đi chợ', 'siêu thị'],
  },
} satisfies Record<string, EventIconDef>;

export type EventIconKey = keyof typeof EVENT_ICONS;

/** Stored on an event to show no icon at all, even when one could be suggested. */
export const NO_ICON = 'none';

export const EVENT_ICON_KEYS = Object.keys(EVENT_ICONS) as EventIconKey[];

function isIconKey(value: string): value is EventIconKey {
  return Object.prototype.hasOwnProperty.call(EVENT_ICONS, value);
}

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// One whole-word matcher per icon. Letters include Vietnamese ones, so "ăn"
// does not match inside "bản".
const MATCHERS = EVENT_ICON_KEYS.map((key) => ({
  key,
  pattern: new RegExp(
    `(?<![\\p{L}\\p{N}])(?:${EVENT_ICONS[key].keywords.map(escapeRegExp).join('|')})(?![\\p{L}\\p{N}])`,
    'iu',
  ),
}));

function matchIcon(text: string | null | undefined): EventIconKey | null {
  if (!text) return null;
  const normalized = text.normalize('NFC').toLowerCase();
  return MATCHERS.find(({ pattern }) => pattern.test(normalized))?.key ?? null;
}

/** Guess an icon from the event's text: the title decides first, then location, then description. */
export function suggestEventIcon(event: {
  title: string;
  location?: string | null;
  description?: string | null;
}): EventIconKey | null {
  return matchIcon(event.title) ?? matchIcon(event.location) ?? matchIcon(event.description);
}

/** The icon to draw for an event: the one picked, else a suggestion; null for none. */
export function resolveEventIcon(event: {
  icon?: string | null;
  title: string;
  location?: string | null;
  description?: string | null;
}): EventIconKey | null {
  if (event.icon === NO_ICON) return null;
  if (event.icon && isIconKey(event.icon)) return event.icon;
  return suggestEventIcon(event);
}
