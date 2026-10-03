import { z } from "zod";

/**
 * Format an integer minor BigInt into an exact decimal string with given scale.
 * Eliminates IEEE-754 floating point issues entirely.
 * Example: 89000n, scale 2 -> "890.00"
 * Example: -1999n, scale 2 -> "-19.99"
 * Example: 5n, scale 2 -> "0.05"
 */
export function formatMinorToDecimal(minor: bigint, scale: number = 2): string {
  if (scale === 0) {
    return minor.toString();
  }

  const isNegative = minor < 0n;
  const absMinor = isNegative ? -minor : minor;
  const factor = 10n ** BigInt(scale);

  const integerPart = absMinor / factor;
  const fractionalPart = (absMinor % factor).toString().padStart(scale, "0");

  const sign = isNegative ? "-" : "";
  return `${sign}${integerPart.toString()}.${fractionalPart}`;
}

/**
 * Parse an exact decimal string into integer minor BigInt with given scale.
 * Throws TypeError if invalid format or if fractional precision exceeds scale.
 * Example: "890.00", scale 2 -> 89000n
 * Example: "19.99", scale 2 -> 1999n
 */
export function parseDecimalStringToMinor(
  decimalStr: string,
  scale: number = 2
): bigint {
  const trimmed = decimalStr.trim();
  const regex = /^(-)?(\d+)(?:\.(\d+))?$/;
  const match = trimmed.match(regex);

  if (!match) {
    throw new TypeError(
      `Invalid decimal monetary string: "${decimalStr}". Expected format "123.45"`
    );
  }

  const [, sign, intStr, fracStr = ""] = match;
  if (fracStr.length > scale) {
    throw new TypeError(
      `Monetary precision overflow: "${decimalStr}" has ${fracStr.length} fractional digits, but scale is ${scale}. Truncation/rounding must be handled explicitly.`
    );
  }

  const paddedFrac = fracStr.padEnd(scale, "0");
  const fullStr = `${intStr}${paddedFrac}`;
  const absValue = BigInt(fullStr);

  return sign === "-" ? -absValue : absValue;
}

/**
 * MoneyMinor schema per Megaplan §8.2 & §23.4
 * - currency: 3-letter uppercase currency code (e.g. USD, PEN)
 * - scale: integer decimal scale (usually 2 for cents/centavos)
 * - minor: exact integer string of minor units (e.g. '89000')
 * - decimal: exact decimal string (e.g. '890.00')
 */
export const MoneyMinorSchema = z
  .object({
    currency: z
      .string()
      .regex(/^[A-Z]{3}$/, {
        message: "currency must be a 3-letter uppercase code (e.g. USD, PEN)",
      }),
    scale: z
      .number()
      .int({ message: "scale must be an integer" })
      .min(0, { message: "scale must be non-negative" })
      .default(2),
    minor: z
      .string()
      .regex(/^-?\d+$/, { message: "minor must be an integer string" }),
    decimal: z
      .string()
      .regex(/^-?\d+(\.\d+)?$/, { message: "decimal must be a valid decimal string" }),
  })
  .refine(
    (data) => {
      try {
        const parsedMinor = parseDecimalStringToMinor(data.decimal, data.scale);
        return parsedMinor === BigInt(data.minor);
      } catch {
        return false;
      }
    },
    {
      message: "Monetary integrity error: minor string does not match decimal value at given scale",
      path: ["decimal"],
    }
  );

export type MoneyMinor = z.infer<typeof MoneyMinorSchema>;

/**
 * Creates a validated MoneyMinor object from minor integer string or BigInt.
 */
export function minorToMoney(
  minor: string | bigint,
  currency: string = "USD",
  scale: number = 2
): MoneyMinor {
  const normCurrency = currency.trim().toUpperCase();
  const minorBigInt = typeof minor === "bigint" ? minor : BigInt(minor.trim());
  const minorStr = minorBigInt.toString();
  const decimalStr = formatMinorToDecimal(minorBigInt, scale);

  return MoneyMinorSchema.parse({
    currency: normCurrency,
    scale,
    minor: minorStr,
    decimal: decimalStr,
  });
}

/**
 * Creates a validated MoneyMinor object from a decimal string.
 */
export function parseDecimalToMoney(
  decimalStr: string,
  currency: string = "USD",
  scale: number = 2
): MoneyMinor {
  const normCurrency = currency.trim().toUpperCase();
  const minorBigInt = parseDecimalStringToMinor(decimalStr, scale);
  const minorStr = minorBigInt.toString();
  const formattedDecimal = formatMinorToDecimal(minorBigInt, scale);

  return MoneyMinorSchema.parse({
    currency: normCurrency,
    scale,
    minor: minorStr,
    decimal: formattedDecimal,
  });
}

/**
 * Exact addition of two MoneyMinor instances.
 * Throws TypeError if currencies or scales do not match.
 */
export function addMoney(a: MoneyMinor, b: MoneyMinor): MoneyMinor {
  if (a.currency !== b.currency) {
    throw new TypeError(
      `Cannot add amounts with different currencies: "${a.currency}" and "${b.currency}"`
    );
  }
  if (a.scale !== b.scale) {
    throw new TypeError(
      `Cannot add amounts with different scales: ${a.scale} and ${b.scale}`
    );
  }

  const sumMinor = BigInt(a.minor) + BigInt(b.minor);
  return minorToMoney(sumMinor, a.currency, a.scale);
}

/**
 * Exact subtraction of two MoneyMinor instances (a - b).
 * Throws TypeError if currencies or scales do not match.
 */
export function subtractMoney(a: MoneyMinor, b: MoneyMinor): MoneyMinor {
  if (a.currency !== b.currency) {
    throw new TypeError(
      `Cannot subtract amounts with different currencies: "${a.currency}" and "${b.currency}"`
    );
  }
  if (a.scale !== b.scale) {
    throw new TypeError(
      `Cannot subtract amounts with different scales: ${a.scale} and ${b.scale}`
    );
  }

  const diffMinor = BigInt(a.minor) - BigInt(b.minor);
  return minorToMoney(diffMinor, a.currency, a.scale);
}

/**
 * Exact multiplication of MoneyMinor by an integer quantity.
 * Throws TypeError if quantity is not an integer or is negative.
 */
export function multiplyMoney(
  money: MoneyMinor,
  quantity: number | bigint
): MoneyMinor {
  if (typeof quantity === "number") {
    if (!Number.isInteger(quantity)) {
      throw new TypeError(
        `Quantity must be an integer for exact multiplication, received: ${quantity}`
      );
    }
    if (quantity < 0) {
      throw new TypeError(`Quantity must be non-negative, received: ${quantity}`);
    }
  } else if (quantity < 0n) {
    throw new TypeError(`Quantity must be non-negative, received: ${quantity}`);
  }

  const resultMinor = BigInt(money.minor) * BigInt(quantity);
  return minorToMoney(resultMinor, money.currency, money.scale);
}

/**
 * Compares two MoneyMinor instances.
 * Returns -1 if a < b, 0 if a === b, 1 if a > b.
 * Throws TypeError if currencies or scales do not match.
 */
export function compareMoney(a: MoneyMinor, b: MoneyMinor): number {
  if (a.currency !== b.currency) {
    throw new TypeError(
      `Cannot compare amounts with different currencies: "${a.currency}" and "${b.currency}"`
    );
  }
  if (a.scale !== b.scale) {
    throw new TypeError(
      `Cannot compare amounts with different scales: ${a.scale} and ${b.scale}`
    );
  }

  const minorA = BigInt(a.minor);
  const minorB = BigInt(b.minor);
  if (minorA < minorB) return -1;
  if (minorA > minorB) return 1;
  return 0;
}

/**
 * Formats MoneyMinor for human display with currency symbol / prefix
 */
export function formatMoneyDisplay(money: MoneyMinor): string {
  const prefix = money.currency === "USD" ? "$" : money.currency === "PEN" ? "S/. " : `${money.currency} `;
  return `${prefix}${money.decimal}`;
}
