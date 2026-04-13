export type PointPixel = [number, number];
export type PointValue = [number, number]; // [rn, kn]

export interface Transform {
  scale_x: number;
  scale_y: number;
  origin_x: number;
  origin_y: number;
}

export function calibrate(p1_px: PointPixel, p1_val: PointValue, p2_px: PointPixel, p2_val: PointValue): Transform {
  const [rn1, kn1] = p1_val;
  const [rn2, kn2] = p2_val;
  const [px1_x, px1_y] = p1_px;
  const [px2_x, px2_y] = p2_px;

  if (rn2 === rn1 || kn2 === kn1) {
    throw new Error("Calibration points must not share an axis value.");
  }

  const scale_x = (px2_x - px1_x) / (rn2 - rn1);
  const scale_y = (px2_y - px1_y) / (kn2 - kn1);
  const origin_x = px1_x - rn1 * scale_x;
  const origin_y = px1_y - kn1 * scale_y;

  return { scale_x, scale_y, origin_x, origin_y };
}

export function toPixel(rn: number, kn: number, transform: Transform): [number, number] {
  const pixel_x = transform.origin_x + rn * transform.scale_x;
  const pixel_y = transform.origin_y + kn * transform.scale_y;
  return [pixel_x, pixel_y];
}

export function toValue(px_x: number, px_y: number, transform: Transform): [number, number] {
    const rn = (px_x - transform.origin_x) / transform.scale_x;
    const kn = (px_y - transform.origin_y) / transform.scale_y;
    return [rn, kn];
}

export function resolveBoundary(val: any, currentPointVal: number, transform: Transform, axis: 'rn' | 'kn'): number {
  if (val === "point") return currentPointVal;
  if (typeof val === 'number') {
    if (axis === 'rn') {
      const [px, _] = toPixel(val, 0, transform);
      return px;
    } else {
      const [_, py] = toPixel(0, val, transform);
      return py;
    }
  }
  return val === null || val === undefined ? 0 : Number(val);
}

export function evaluateConditionalLimits(rules: any[], kn: number, rn: number, typeKey: string): any {
  if (!rules || !Array.isArray(rules)) return null;
  const sortedRules = [...rules].sort((a, b) => {
    const maxA = Math.max(a.if_rn_above || 0, a.if_kn_above || 0);
    const maxB = Math.max(b.if_rn_above || 0, b.if_kn_above || 0);
    return maxB - maxA;
  });

  for (const rule of sortedRules) {
    let match = false;
    if ("if_rn_above" in rule && rn > rule["if_rn_above"]) {
      match = true;
    } else if ("if_kn_above" in rule && kn > rule["if_kn_above"]) {
      match = true;
    }
    if (match) {
      return rule[`then_${typeKey}`];
    }
  }
  return null;
}
