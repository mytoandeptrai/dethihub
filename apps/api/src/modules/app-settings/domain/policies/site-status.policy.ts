const MAX_SHOWN = 5

export interface SiteAnnouncement {
  id: string
  on: boolean
  title: string
  text: string
  image: string
  tryPath: string
  until: string | null
}

/** Switched on, not expired, capped like the popup shows them */
export const visibleAnnouncements = (items: SiteAnnouncement[], now: number): SiteAnnouncement[] =>
  items
    .filter((item) => item.on && (!item.until || Date.parse(item.until) > now))
    .slice(0, MAX_SHOWN)
