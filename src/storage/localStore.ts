export const store = {
  async get<T>(key: string, fallback: T): Promise<T> {
    const v = await chrome.storage.local.get(key); return (v[key] ?? fallback) as T;
  },
  async set<T>(key: string, value: T): Promise<void> { await chrome.storage.local.set({ [key]: value }); }
};
