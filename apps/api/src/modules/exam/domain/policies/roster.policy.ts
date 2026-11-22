const MAX_SEAT = 999

export interface RosterStudent {
  name: string
  seat: number | undefined
}

const normalize = (name: string): string => name.trim().normalize('NFC').toLowerCase()

/**
 * An exam with a class list only takes students on that list. The stored name and seat are the
 * list's own (seat = position + 1), whatever the student typed. Null when the name is not listed.
 */
export function resolveStudent(
  roster: readonly unknown[] | undefined,
  name: string,
  seat: number | undefined,
): RosterStudent | null {
  if (!roster || roster.length === 0) return { name, seat }
  const wanted = normalize(name)
  const matches = (entry: unknown) => typeof entry === 'string' && normalize(entry) === wanted
  // The seat the student picked wins, which tells duplicate names apart
  const index =
    seat !== undefined && matches(roster[seat - 1])
      ? seat - 1
      : roster.findIndex((entry) => matches(entry))
  if (index < 0) return null
  return { name: roster[index] as string, seat: index < MAX_SEAT ? index + 1 : undefined }
}
