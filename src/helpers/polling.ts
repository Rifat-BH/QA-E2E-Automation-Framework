/**
 * Waiting for one system to agree with a change made in another.
 *
 * A write that crosses a queue, a replication hop or a worker is never
 * instant, and a fixed sleep is wrong in both directions: too short and the
 * test is flaky, too long and every run pays for the worst case.
 */

export interface PollOptions {
  timeout: number;
  intervals: number[];
  message: string;
}

/**
 * Intervals back off because the first read almost always misses, and each
 * attempt may be a full page load or round trip.
 */
const DEFAULT_INTERVALS = [1_000, 2_000, 3_000, 5_000];

export function syncPoll(from: string, to: string, timeout = 45_000): PollOptions {
  return {
    timeout,
    intervals: DEFAULT_INTERVALS,
    message: `Expected the change made in ${from} to reach ${to}`,
  };
}

export type Unreadable = { unreadable: string };

/**
 * Wraps a read so a transient failure does not end the wait.
 *
 * `expect.poll` stops the moment its callback throws, so an unwrapped read
 * turns one slow page load into a failed run seconds into a much longer
 * budget. A read that throws means "not agreeing yet", not "the test is
 * broken". Returning the error instead keeps the poll alive and still shows
 * what happened if it never succeeds.
 */
export function pollRead<T>(read: () => Promise<T>): () => Promise<T | Unreadable> {
  return async () => {
    try {
      return await read();
    } catch (error) {
      return { unreadable: error instanceof Error ? error.message : String(error) };
    }
  };
}
