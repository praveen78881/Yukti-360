// Curated Lucide icon registry.
//
// Icons referenced dynamically by string name (entity-type icons, settings tabs)
// are looked up here instead of via `import * as LucideIcons`. Importing the whole
// namespace and indexing it by a runtime key defeats tree-shaking and pulls the
// ENTIRE lucide-react library into the bundle (~860 kB). This registry names only
// the icons actually used, so Rollup drops the rest.
//
// When a new dynamic icon name is added to a config, add it here too.

import {
  Building2, Calendar, FolderClosed, Handshake, Heart, HeartHandshake, Home,
  Landmark, Network, Printer, Settings, Shield, Sparkles, Table, User,
  UserCheck, UserCircle, Users, Users2,
  type LucideIcon,
} from 'lucide-react';

export const ICON_REGISTRY: Record<string, LucideIcon> = {
  Building2, Calendar, FolderClosed, Handshake, Heart, HeartHandshake, Home,
  Landmark, Network, Printer, Settings, Shield, Sparkles, Table, User,
  UserCheck, UserCircle, Users, Users2,
};

/** Resolve a dynamic icon name to a component, falling back to Building2. */
export function getIcon(name?: string | null): LucideIcon {
  return (name && ICON_REGISTRY[name]) || Building2;
}
