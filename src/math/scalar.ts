const {
  isFinite,
  isInteger,
  isNaN,
  isSafeInteger,
  parseFloat,
  parseInt,
  MAX_VALUE,
  MIN_VALUE,
  NEGATIVE_INFINITY,
  POSITIVE_INFINITY,
  MAX_SAFE_INTEGER,
  MIN_SAFE_INTEGER,
  EPSILON: NUMBER_EPSILON
} = Number

const {
  abs,
  acos,
  acosh,
  asin,
  asinh,
  atan,
  atanh,
  atan2,
  ceil,
  cbrt,
  expm1,
  clz32,
  cos,
  cosh,
  exp,
  floor,
  fround,
  hypot,
  imul,
  log,
  log1p,
  log2,
  log10,
  max,
  min,
  random,
  round,
  sign,
  sin,
  sinh,
  sqrt,
  tan,
  tanh,
  trunc,
  E,
  LN10,
  LN2,
  LOG10E,
  LOG2E,
  PI,
  SQRT1_2,
  SQRT2
} = Math

export {
  isFinite,
  isInteger,
  isNaN,
  isSafeInteger,
  parseFloat,
  parseInt,
  MAX_VALUE,
  MIN_VALUE,
  NEGATIVE_INFINITY,
  POSITIVE_INFINITY,
  MAX_SAFE_INTEGER,
  MIN_SAFE_INTEGER,
  NUMBER_EPSILON,
  abs,
  acos,
  acosh,
  asin,
  asinh,
  atan,
  atanh,
  atan2,
  ceil,
  cbrt,
  expm1,
  clz32,
  cos,
  cosh,
  exp,
  floor,
  fround,
  hypot,
  imul,
  log,
  log1p,
  log2,
  log10,
  max,
  min,
  random,
  round,
  sign,
  sin,
  sinh,
  sqrt,
  tan,
  tanh,
  trunc,
  E,
  LN10,
  LN2,
  LOG10E,
  LOG2E,
  PI,
  SQRT1_2,
  SQRT2
}

export const TWO_PI = PI * 2

export const PI_OVER_TWO = PI / 2

export const PI_OVER_FOUR = PI / 4

export const PI_OVER_SIX = PI / 6

export const DEG_TO_RAD = PI / 180

export const RAD_TO_DEG = 180 / PI

export const TOLERANCE = 0.000001

export const pow = (a: number, b: number) => a ** b

export const isZero = (value: any) => value === 0

export const scalarEquals = (a: number, b: number) => a === b

export const almostEquals = (a: number, b: number, tolerance = TOLERANCE): boolean =>
  a === b || abs(a - b) <= tolerance * max(1, abs(a), abs(b))

export const almostZero = (value: number, tolerance = TOLERANCE): boolean => abs(value) < tolerance

export const degToRad = (degrees: number): number => degrees * DEG_TO_RAD

export const radToDeg = (degrees: number): number => degrees * RAD_TO_DEG

export const lerp = (from: number, to: number, t: number): number => from + t * (to - from)

export const inverseLerp = (from: number, to: number, value: number): number => (value - from) / (to - from)

export const angleLerp = (from: number, to: number, t: number): number => {
  const difference = (to - from) % TWO_PI
  return from + (((2 * difference) % TWO_PI) - difference) * t
}

export const clamp = (value: number, minimum: number, maximum: number): number => min(max(value, minimum), maximum)

export const wrapAngleInRadians = (angle: number): number => {
  const x = (angle + PI) % TWO_PI
  return x < 0 ? x + TWO_PI : x - PI
}

export const smoothStep = (from: number, to: number, t: number): number => {
  if (abs(from - to) <= t * max(1, abs(from), abs(to))) {
    return from
  }
  const x = min(max((t - from) / (to - from), 0), 1)
  return x * x * (3 - 2 * x)
}

export const scalarSnap = (value: number, step: number): number =>
  step !== 0 ? floor(value / step + 0.5) * step : value