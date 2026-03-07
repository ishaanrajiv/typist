import "@testing-library/jest-dom/vitest";

const localStore = new Map<string, string>();

const localStorageMock = {
  getItem: (key: string): string | null => localStore.get(key) ?? null,
  setItem: (key: string, value: string): void => {
    localStore.set(key, value);
  },
  removeItem: (key: string): void => {
    localStore.delete(key);
  },
  clear: (): void => {
    localStore.clear();
  },
};

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  configurable: true,
});
