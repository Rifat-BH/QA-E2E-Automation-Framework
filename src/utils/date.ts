/**
 * Date formatting lives here, not in page objects.
 *
 * Every UI spells a date its own way and each page object translates at its
 * own edge. Keeping the conversions in one file means the canonical form
 * stays ISO everywhere else, and a locale change is one edit.
 */

/** "1990-05-04" to "05/04/1990". */
export function isoToUs(iso: string): string {
  const [year, month, day] = iso.split('-');

  if (!year || !month || !day) {
    throw new Error(`Expected an ISO date ("YYYY-MM-DD"), received "${iso}".`);
  }

  return `${month}/${day}/${year}`;
}

/** "05/04/1990" to "1990-05-04". */
export function usToIso(us: string): string {
  const [month, day, year] = us.split('/');

  if (!year || !month || !day) {
    throw new Error(`Expected a US date ("MM/DD/YYYY"), received "${us}".`);
  }

  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

/** Whole years, counting a birthday later in the year as not yet reached. */
export function ageFrom(isoDateOfBirth: string, today = new Date()): number {
  const born = new Date(`${isoDateOfBirth}T00:00:00Z`);
  let age = today.getUTCFullYear() - born.getUTCFullYear();
  const beforeBirthday =
    today.getUTCMonth() < born.getUTCMonth() ||
    (today.getUTCMonth() === born.getUTCMonth() && today.getUTCDate() < born.getUTCDate());

  if (beforeBirthday) {
    age -= 1;
  }

  return age;
}
