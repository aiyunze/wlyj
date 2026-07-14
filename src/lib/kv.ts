interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

class MemoryKV {
  private store = new Map<string, { value: string; expiresAt?: number }>();

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: options?.expirationTtl ? Date.now() + options.expirationTtl * 1000 : undefined,
    });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }
}

let memoryKV: MemoryKV | null = null;

function getMemoryKV(): MemoryKV {
  if (!memoryKV) {
    memoryKV = new MemoryKV();
  }
  return memoryKV;
}

export function getKV(): KVNamespace {
  if ((globalThis as any).KV) {
    return (globalThis as any).KV as KVNamespace;
  }
  return getMemoryKV() as unknown as KVNamespace;
}

export async function getSession(token: string): Promise<{ username: string; createdAt: string } | null> {
  const kv = getKV();
  const data = await kv.get(`session:${token}`);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export async function createSession(username: string): Promise<string> {
  const kv = getKV();
  const { randomUUID } = await import("crypto");
  const token = randomUUID();
  await kv.put(`session:${token}`, JSON.stringify({ username, createdAt: new Date().toISOString() }), {
    expirationTtl: 86400,
  });
  return token;
}

export async function deleteSession(token: string): Promise<void> {
  const kv = getKV();
  await kv.delete(`session:${token}`);
}

export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number }> {
  const kv = getKV();
  const fullKey = `ratelimit:${key}`;
  const data = await kv.get(fullKey);
  const now = Math.floor(Date.now() / 1000);
  let count = 0;
  if (data) {
    try {
      const parsed = JSON.parse(data);
      if (parsed.window >= now) {
        count = parsed.count;
      }
    } catch {
      // ignore
    }
  }
  count++;
  if (count > maxRequests) {
    return { allowed: false, remaining: 0 };
  }
  await kv.put(fullKey, JSON.stringify({ count, window: now + windowSeconds }), {
    expirationTtl: windowSeconds,
  });
  return { allowed: true, remaining: maxRequests - count };
}

export async function getCronLock(): Promise<boolean> {
  const kv = getKV();
  const lock = await kv.get("cron:lock");
  if (lock) return false;
  await kv.put("cron:lock", JSON.stringify({ startedAt: new Date().toISOString() }), {
    expirationTtl: 300,
  });
  return true;
}

export async function releaseCronLock(): Promise<void> {
  const kv = getKV();
  await kv.delete("cron:lock");
}

export async function getCached<T>(key: string, ttlSeconds: number, fetchFn: () => Promise<T>): Promise<T> {
  const kv = getKV();
  const cacheKey = `cache:${key}`;
  const cached = await kv.get(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached) as T;
    } catch {
      // ignore
    }
  }
  const data = await fetchFn();
  await kv.put(cacheKey, JSON.stringify(data), { expirationTtl: ttlSeconds });
  return data;
}

export async function invalidateCache(key: string): Promise<void> {
  const kv = getKV();
  await kv.delete(`cache:${key}`);
}