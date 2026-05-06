import { prisma } from "@/lib/prisma";

const CACHE_TTL_MS = 5 * 60 * 1000;

type Cached = { value: unknown; expiresAt: number };
const cache = new Map<string, Cached>();

type AppConfigValueByType = {
  string: string;
  int: number;
  float: number;
  bool: boolean;
  json: unknown;
};

export type AppConfigValueType = keyof AppConfigValueByType;

export class AppConfigError extends Error {}

function parseValue(raw: string, valueType: string): unknown {
  switch (valueType) {
    case "string":
      return raw;
    case "int": {
      const n = Number.parseInt(raw, 10);
      if (Number.isNaN(n)) throw new AppConfigError(`int parse: ${raw}`);
      return n;
    }
    case "float": {
      const n = Number.parseFloat(raw);
      if (Number.isNaN(n)) throw new AppConfigError(`float parse: ${raw}`);
      return n;
    }
    case "bool":
      return raw === "true" || raw === "1";
    case "json":
      return JSON.parse(raw);
    default:
      throw new AppConfigError(`unknown valueType: ${valueType}`);
  }
}

export async function getAppConfig<T extends AppConfigValueType>(
  key: string,
  expected: T,
): Promise<AppConfigValueByType[T]> {
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && hit.expiresAt > now) {
    return hit.value as AppConfigValueByType[T];
  }

  const row = await prisma.appConfig.findUnique({ where: { key } });
  if (!row) throw new AppConfigError(`AppConfig key not found: ${key}`);
  if (row.valueType !== expected) {
    throw new AppConfigError(
      `AppConfig ${key} expected ${expected}, got ${row.valueType}`,
    );
  }
  const parsed = parseValue(row.value, row.valueType);
  cache.set(key, { value: parsed, expiresAt: now + CACHE_TTL_MS });
  return parsed as AppConfigValueByType[T];
}

export function invalidateAppConfigCache(key?: string): void {
  if (key) cache.delete(key);
  else cache.clear();
}
