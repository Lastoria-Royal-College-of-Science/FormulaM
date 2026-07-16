const TEN = 10n;

export type RoundingMode = "ceil" | "floor" | "round";
export interface Rational {
  numerator: bigint;
  denominator: bigint;
}

export function expandExponential(rawValue: unknown): string {
  const text = String(rawValue).trim();
  if (!/[eE]/.test(text)) return text;

  const match = text.match(/^([+-]?)(\d*\.?\d+)[eE]([+-]?\d+)$/);
  if (!match) throw new Error(`Invalid decimal value: ${rawValue}`);

  const sign = match[1] || "";
  const mantissa = match[2];
  const exponent = Number.parseInt(match[3], 10);
  const [wholeRaw, fracRaw = ""] = mantissa.split(".");
  const digits = `${wholeRaw || "0"}${fracRaw}`.replace(/^0+(?=\d)/, "") || "0";
  const decimalPosition = (wholeRaw || "0").length + exponent;

  if (decimalPosition <= 0) {
    return `${sign}0.${"0".repeat(Math.abs(decimalPosition))}${digits}`;
  }
  if (decimalPosition >= digits.length) {
    return `${sign}${digits}${"0".repeat(decimalPosition - digits.length)}`;
  }
  return `${sign}${digits.slice(0, decimalPosition)}.${digits.slice(decimalPosition)}`;
}

export function parseDecimalToRational(rawValue: unknown): Rational {
  const expanded = expandExponential(rawValue);
  const match = expanded.match(/^([+-]?)(\d+)(?:\.(\d*))?$/);
  if (!match) throw new Error(`Invalid decimal value: ${rawValue}`);

  const sign = match[1] === "-" ? -1n : 1n;
  const whole = match[2];
  const frac = match[3] || "";
  const digits = `${whole}${frac}`.replace(/^0+(?=\d)/, "") || "0";
  return {
    numerator: sign * BigInt(digits),
    denominator: TEN ** BigInt(frac.length),
  };
}

export function decimalToScaledBigInt(
  rawValue: unknown,
  scaleDigits = 9,
  rounding: RoundingMode = "round",
): bigint {
  const expanded = expandExponential(rawValue);
  const match = expanded.match(/^([+-]?)(\d+)(?:\.(\d*))?$/);
  if (!match) throw new Error(`Invalid decimal value: ${rawValue}`);

  const sign = match[1] === "-" ? -1n : 1n;
  const whole = match[2];
  const frac = match[3] || "";
  const padded = frac.padEnd(scaleDigits, "0");
  const kept = padded.slice(0, scaleDigits);
  const extra = frac.length > scaleDigits ? frac.slice(scaleDigits) : "";
  let magnitude = BigInt(`${whole}${kept}`.replace(/^0+(?=\d)/, "") || "0");

  const hasExtra = /[1-9]/.test(extra);
  if (hasExtra) {
    if (rounding === "ceil" && sign > 0n) magnitude += 1n;
    if (rounding === "floor" && sign < 0n) magnitude += 1n;
    if (rounding === "round" && Number(extra[0]) >= 5) magnitude += 1n;
  }
  return sign * magnitude;
}

export function floorDiv(a: bigint, b: bigint): bigint {
  if (b <= 0n) throw new Error("floorDiv divisor must be positive");
  let q = a / b;
  const r = a % b;
  if (r !== 0n && a < 0n) q -= 1n;
  return q;
}

export function ceilDiv(a: bigint, b: bigint): bigint {
  if (b <= 0n) throw new Error("ceilDiv divisor must be positive");
  return -floorDiv(-a, b);
}

export function ceilRational(numerator: bigint, denominator: bigint): bigint {
  if (denominator <= 0n) throw new Error("denominator must be positive");
  if (numerator >= 0n) return (numerator + denominator - 1n) / denominator;
  return numerator / denominator;
}

export function absBigInt(value: bigint): bigint {
  return value < 0n ? -value : value;
}

export function maxBigInt(a: bigint, b: bigint): bigint {
  return a > b ? a : b;
}

export function bigIntToDecimalString(
  value: bigint,
  scaleDigits = 9,
  fractionDigits = scaleDigits,
): string {
  const sign = value < 0n ? "-" : "";
  const magnitude = value < 0n ? -value : value;
  const scale = TEN ** BigInt(scaleDigits);
  const whole = magnitude / scale;
  let frac = (magnitude % scale).toString().padStart(scaleDigits, "0");

  if (fractionDigits < scaleDigits) {
    const keep = frac.slice(0, fractionDigits);
    const extra = frac.slice(fractionDigits);
    let rounded = BigInt(`${whole}${keep}` || "0");
    if (extra && Number(extra[0]) >= 5) rounded += 1n;
    return bigIntToDecimalString(sign === "-" ? -rounded : rounded, fractionDigits, fractionDigits);
  }

  frac = frac.padEnd(fractionDigits, "0").slice(0, fractionDigits);
  return fractionDigits === 0 ? `${sign}${whole}` : `${sign}${whole}.${frac}`;
}

export function rationalToDecimalString(
  numerator: bigint,
  denominator: bigint,
  fractionDigits = 9,
): string {
  if (denominator <= 0n) throw new Error("denominator must be positive");
  const sign = numerator < 0n ? "-" : "";
  const n = numerator < 0n ? -numerator : numerator;
  const scale = TEN ** BigInt(fractionDigits);
  let scaled = (n * scale) / denominator;
  const remainder = (n * scale) % denominator;
  if (remainder * 2n >= denominator) scaled += 1n;
  const whole = scaled / scale;
  const frac = (scaled % scale).toString().padStart(fractionDigits, "0");
  return fractionDigits === 0 ? `${sign}${whole}` : `${sign}${whole}.${frac}`;
}

export function nonNegativeDecimalRational(rawValue: unknown, label: string): Rational {
  const rational = parseDecimalToRational(rawValue);
  if (rational.numerator < 0n) throw new Error(`${label} must be non-negative`);
  return rational;
}
