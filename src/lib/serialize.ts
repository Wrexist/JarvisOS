/**
 * Serializes an object, converting BigInt values to strings.
 * Required for GitHub IDs which are stored as BigInt in Prisma.
 */
export function serializeBigInt<T>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (_, v) =>
      typeof v === "bigint" ? v.toString() : v
    )
  ) as T;
}
