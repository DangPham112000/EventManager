import { cn } from '@/lib/utils';
import { EVENT_ICONS, resolveEventIcon, type EventIconKey, type IconLayer } from '@/lib/eventIcons';

interface IconGlyphProps {
  icon: EventIconKey;
  className?: string;
}

/** Draws one icon from the event icon set, in the current text color. */
export function IconGlyph({ icon, className }: IconGlyphProps) {
  const def = EVENT_ICONS[icon];
  const layers: IconLayer[] = def.layers;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      role="img"
      aria-label={def.label}
      className={cn('inline-block h-4 w-4 shrink-0', className)}
    >
      <title>{def.label}</title>
      {layers.map((layer, i) => (
        <path key={i} d={layer.path} transform={layer.transform} />
      ))}
    </svg>
  );
}

interface EventIconProps {
  event: { icon?: string | null; title: string; location?: string | null; description?: string | null };
  className?: string;
}

/** The icon shown before an event's title: the one picked, else one suggested from its text. */
export function EventIcon({ event, className }: EventIconProps) {
  const icon = resolveEventIcon(event);
  return icon ? <IconGlyph icon={icon} className={className} /> : null;
}
