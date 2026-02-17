/**
 * Signature smoothing utilities.
 *
 * Converts raw "M x y L x y L x y …" paths into smooth quadratic
 * Bézier curves, and computes per-segment velocity for variable
 * stroke-width rendering.
 */

interface Point {
    x: number;
    y: number;
    t: number; // timestamp for velocity
}

/**
 * Parse a raw SVG path string (M/L only) into an array of points.
 */
export function parseRawPath(d: string): Point[] {
    const parts = d.trim().split(/\s+/);
    const points: Point[] = [];
    let i = 0;

    while (i < parts.length) {
        const cmd = parts[i];
        if ((cmd === "M" || cmd === "L") && i + 2 < parts.length) {
            points.push({
                x: parseFloat(parts[i + 1]),
                y: parseFloat(parts[i + 2]),
                t: 0,
            });
            i += 3;
        } else {
            i += 1;
        }
    }

    return points;
}

/**
 * Convert an array of points into a smooth quadratic Bézier SVG path.
 * Uses the midpoint algorithm: draw quadratic curves through the
 * midpoints of consecutive points, using the actual points as
 * control points.
 */
export function smoothPath(points: Point[]): string {
    if (points.length === 0) return "";
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
    if (points.length === 2) {
        return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
    }

    let d = `M ${points[0].x} ${points[0].y}`;

    // First segment: line to midpoint of p0-p1
    const mid0x = (points[0].x + points[1].x) / 2;
    const mid0y = (points[0].y + points[1].y) / 2;
    d += ` L ${mid0x.toFixed(1)} ${mid0y.toFixed(1)}`;

    // Middle segments: quadratic Béziers through midpoints
    for (let i = 1; i < points.length - 1; i++) {
        const cpx = points[i].x;
        const cpy = points[i].y;
        const midx = (points[i].x + points[i + 1].x) / 2;
        const midy = (points[i].y + points[i + 1].y) / 2;
        d += ` Q ${cpx.toFixed(1)} ${cpy.toFixed(1)} ${midx.toFixed(1)} ${midy.toFixed(1)}`;
    }

    // Last segment: line to last point
    const last = points[points.length - 1];
    d += ` L ${last.x.toFixed(1)} ${last.y.toFixed(1)}`;

    return d;
}

/**
 * Compute stroke widths per segment based on velocity.
 * Fast movement → thin line, slow movement → thick line.
 */
export function computeStrokeWidths(
    points: Point[],
    minWidth: number = 1.2,
    maxWidth: number = 3.5
): number[] {
    if (points.length < 2) return [maxWidth];

    const widths: number[] = [];

    for (let i = 1; i < points.length; i++) {
        const dx = points[i].x - points[i - 1].x;
        const dy = points[i].y - points[i - 1].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const dt = Math.max(points[i].t - points[i - 1].t, 1);
        const velocity = dist / dt;

        // Map velocity to width: fast → thin, slow → thick
        // Clamp velocity between 0.1 and 4.0 px/ms
        const normalized = Math.min(Math.max(velocity, 0.1), 4.0);
        const ratio = 1 - (normalized - 0.1) / 3.9;
        const width = minWidth + ratio * (maxWidth - minWidth);
        widths.push(parseFloat(width.toFixed(1)));
    }

    return widths;
}

/**
 * Smoothes a raw path string (M/L format) into a Bézier path.
 * This is the main function to use — drop-in replacement for raw paths.
 */
export function smoothRawPath(rawD: string): string {
    const points = parseRawPath(rawD);
    return smoothPath(points);
}

/**
 * Enhanced path data with timestamps for velocity-aware rendering.
 */
export interface StrokeSegment {
    path: string;
    strokeWidth: number;
}

/**
 * Split a stroke (with timestamps) into multiple sub-path segments
 * with varying stroke widths based on drawing velocity.
 *
 * For simplicity, we use the average velocity across the whole stroke
 * and apply a single (but velocity-adaptive) stroke width.
 */
export function velocityStrokeWidth(points: Point[]): number {
    if (points.length < 2) return 2.4;

    let totalDist = 0;
    let totalTime = 0;

    for (let i = 1; i < points.length; i++) {
        const dx = points[i].x - points[i - 1].x;
        const dy = points[i].y - points[i - 1].y;
        totalDist += Math.sqrt(dx * dx + dy * dy);
        totalTime += Math.max(points[i].t - points[i - 1].t, 1);
    }

    const avgVelocity = totalDist / Math.max(totalTime, 1);
    const normalized = Math.min(Math.max(avgVelocity, 0.05), 3.0);
    const ratio = 1 - (normalized - 0.05) / 2.95;
    return parseFloat((1.2 + ratio * 2.3).toFixed(1));
}
