/**
 * Deterministic segment grouping and direction suggestion.
 *
 * Groups flight segments into three customer-facing buckets:
 *   - outbound  → "Keberangkatan"
 *   - return    → "Kepulangan"
 *   - other     → "Rute lainnya"
 *
 * Direction is only a SUGGESTION. It must always remain user-editable; the
 * editor and PDF render whatever direction is finally stored on each segment.
 */

import type { FlightDirection, TicketTripType } from "@/modules/finance/types/ticketing";

export type DirectionableSegment = {
  departureAirport: string | null;
  arrivalAirport: string | null;
};

/**
 * Suggest a direction per segment based purely on order and return pattern.
 * Round trips detect the turnaround via airport-sequence symmetry; anything
 * else defaults to outbound. Never throws.
 */
export function suggestSegmentDirections(
  segments: DirectionableSegment[],
  tripType: TicketTripType,
): FlightDirection[] {
  const n = segments.length;
  if (n === 0) return [];

  if (tripType !== "round_trip") {
    // one_way and multi_city both surface under "Keberangkatan" by default;
    // the user can reassign any leg to "Rute lainnya" or "Kepulangan".
    return segments.map(() => "outbound");
  }

  const returnStart = suggestReturnStart(segments);
  return segments.map((_, index) =>
    index >= returnStart ? "return" : "outbound",
  );
}

/**
 * Index at which the return journey begins. Uses airport-visit symmetry
 * (mirrored out-and-back) when segments form a contiguous chain, else a
 * balanced midpoint fallback.
 */
export function suggestReturnStart(segments: DirectionableSegment[]): number {
  const n = segments.length;
  if (n < 2) return n;

  const contiguous = segments.every(
    (seg, index) =>
      index === 0 ||
      (seg.departureAirport != null &&
        segments[index - 1]!.arrivalAirport === seg.departureAirport),
  );

  if (contiguous) {
    // visits: [seg0.dep, seg0.arr, seg1.arr, ..., seg[n-1].arr] length n+1
    const visits: (string | null)[] = [segments[0]!.departureAirport];
    for (const seg of segments) visits.push(seg.arrivalAirport);

    let bestPeak = -1;
    let bestScore = -1;
    for (let k = 1; k < n; k += 1) {
      let score = 0;
      while (
        k - 1 - score >= 0 &&
        k + 1 + score <= n &&
        visits[k - 1 - score] != null &&
        visits[k - 1 - score] === visits[k + 1 + score]
      ) {
        score += 1;
      }
      if (score > bestScore) {
        bestScore = score;
        bestPeak = k;
      }
    }
    if (bestScore > 0 && bestPeak > 0) {
      return bestPeak;
    }
  }

  return Math.ceil(n / 2);
}

export type GroupedSegments<T> = {
  outbound: T[];
  return: T[];
  other: T[];
};

/** Split segments (that carry a `direction`) into the three display buckets. */
export function groupSegmentsByDirection<T extends { direction: FlightDirection }>(
  segments: T[],
): GroupedSegments<T> {
  const grouped: GroupedSegments<T> = { outbound: [], return: [], other: [] };
  for (const segment of segments) {
    if (segment.direction === "return") grouped.return.push(segment);
    else if (segment.direction === "other") grouped.other.push(segment);
    else grouped.outbound.push(segment);
  }
  return grouped;
}
