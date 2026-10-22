import { readonly, ref } from 'vue';

export interface Bookmark {
  path: string;
  title: string;
  chapter?: string;
  addedAt: string;
}

const STORAGE_KEY = 'go-book:bookmarks:v1';
const bookmarks = ref<Bookmark[]>([]);
const loaded = ref(false);
let storageListenerInstalled = false;

function isBookmark(value: unknown): value is Bookmark {
  if (typeof value !== 'object' || value === null) return false;

  const bookmark = value as Record<string, unknown>;
  return (
    typeof bookmark.path === 'string' &&
    bookmark.path.startsWith('/') &&
    typeof bookmark.title === 'string' &&
    (bookmark.chapter === undefined || typeof bookmark.chapter === 'string') &&
    typeof bookmark.addedAt === 'string'
  );
}

function parseBookmarks(value: string | null): Bookmark[] {
  if (!value) return [];

  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    const paths = new Set<string>();
    return parsed.filter((bookmark): bookmark is Bookmark => {
      if (!isBookmark(bookmark) || paths.has(bookmark.path)) return false;
      paths.add(bookmark.path);
      return true;
    });
  } catch {
    return [];
  }
}

function persist(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks.value));
  } catch {
    // Если localStorage недоступен, закладки работают до перезагрузки.
  }
}

function load(): void {
  if (loaded.value || typeof window === 'undefined') return;

  try {
    bookmarks.value = parseBookmarks(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    bookmarks.value = [];
  }
  loaded.value = true;

  if (!storageListenerInstalled) {
    window.addEventListener('storage', event => {
      if (event.key === STORAGE_KEY) {
        bookmarks.value = parseBookmarks(event.newValue);
      }
    });
    storageListenerInstalled = true;
  }
}

export function useBookmarks() {
  const add = (path: string, title: string, chapter?: string): void => {
    load();
    if (bookmarks.value.some(bookmark => bookmark.path === path)) return;

    bookmarks.value = [
      ...bookmarks.value,
      {
        path,
        title: title.trim() || 'Страница учебника',
        chapter: chapter?.trim() || undefined,
        addedAt: new Date().toISOString(),
      },
    ];
    persist();
  };

  const remove = (path: string): void => {
    load();
    bookmarks.value = bookmarks.value.filter(
      bookmark => bookmark.path !== path,
    );
    persist();
  };

  const clear = (): void => {
    load();
    bookmarks.value = [];
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Состояние в памяти уже очищено.
    }
  };

  return { bookmarks: readonly(bookmarks), load, add, remove, clear };
}
