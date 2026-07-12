import { AlovaGlobalCacheAdapter } from '~/typings';

const hasFinalizationRegistry = typeof FinalizationRegistry !== 'undefined';
const WARN_THRESHOLD = 20;

interface Entry {
  adapter: AlovaGlobalCacheAdapter;
  index: number;
}

function dedup<T>(entries: Entry[], mapFn: (e: Entry) => T): T[] {
  const seen = new Set<T>();
  const result: T[] = [];
  for (const entry of entries) {
    const value = mapFn(entry);
    if (!seen.has(value)) {
      seen.add(value);
      result.push(value);
    }
  }
  return result;
}

/**
 * Manages cache adapters from active alova instances so that global cache
 * operations (e.g. invalidateCache without a matcher, hitCacheBySource in
 * global mode) can iterate over all living adapters without holding strong
 * references to alova instances themselves.
 *
 * ## Design
 *
 * Adapters are held with **strong references** so they are never
 * half-alive.  The manager tracks which `target` (an alova instance)
 * owns each adapter pair so that removals are O(1).
 *
 * | Path                        | Cleanup                              | Complexity |
 * |-----------------------------|--------------------------------------|------------|
 * | ES2021+ (FinalizationRegistry) | Automatic: target GC → callback → swap-and-pop | O(1) |
 * | Legacy (no FinalizationRegistry) | Manual: `alova.destroy()` → swap-and-pop + warning | O(1) |
 *
 * There is no `sweep()` method — the FinalizationRegistry callback
 * handles dead entries immediately and atomically.
 */
export class CacheAdapterManager {
  private l1Entries: Entry[] = [];
  private l2Entries: Entry[] = [];
  private l1Map = new WeakMap<object, Entry>();
  private l2Map = new WeakMap<object, Entry>();
  private registry: FinalizationRegistry<{ l1Entry: Entry; l2Entry: Entry }> | undefined;
  private warned = false;

  constructor() {
    if (hasFinalizationRegistry) {
      this.registry = new FinalizationRegistry(heldValue => {
        this.swapRemove(this.l1Entries, heldValue.l1Entry);
        this.swapRemove(this.l2Entries, heldValue.l2Entry);
      });
    }
  }

  /**
   * Register a pair of cache adapters for the given target (alova instance).
   * Each target can only be registered once.
   */
  register(target: object, l1Cache: AlovaGlobalCacheAdapter, l2Cache: AlovaGlobalCacheAdapter) {
    // If already registered, skip
    if (this.l1Map.has(target) || this.l2Map.has(target)) {
      return;
    }

    const l1Entry: Entry = { adapter: l1Cache, index: this.l1Entries.length };
    this.l1Entries.push(l1Entry);
    this.l1Map.set(target, l1Entry);

    const l2Entry: Entry = { adapter: l2Cache, index: this.l2Entries.length };
    this.l2Entries.push(l2Entry);
    this.l2Map.set(target, l2Entry);

    if (this.registry) {
      this.registry.register(target, { l1Entry, l2Entry }, target);
    } else if (!this.warned && this.l1Entries.length >= WARN_THRESHOLD) {
      this.warned = true;
      // eslint-disable-next-line no-console
      console.warn(
        '[alova] FinalizationRegistry is not available in the current environment, cache adapters will remain in memory. ' +
          'Please call `alova.destroy()` when an instance is no longer needed to avoid memory leaks.'
      );
    }
  }

  /**
   * Unregister the adapters associated with `target`.
   * Uses swap-and-pop for O(1) removal.
   */
  unregister(target: object) {
    // Remove from L1
    const l1Entry = this.l1Map.get(target);
    if (l1Entry) {
      this.swapRemove(this.l1Entries, l1Entry);
      this.l1Map.delete(target);
    }

    // Remove from L2
    const l2Entry = this.l2Map.get(target);
    if (l2Entry) {
      this.swapRemove(this.l2Entries, l2Entry);
      this.l2Map.delete(target);
    }

    // Prevent the FinalizationRegistry callback from firing
    if (this.registry) {
      this.registry.unregister(target);
    }
  }

  /**
   * Swap the entry at the given position with the last element, then pop.
   * This is O(1) and keeps the array tightly packed.
   */
  private swapRemove(entries: Entry[], entry: Entry) {
    const last = entries[entries.length - 1];
    if (last && last !== entry) {
      last.index = entry.index;
      entries[entry.index] = last;
    }
    entries.pop();
  }

  get l1(): AlovaGlobalCacheAdapter[] {
    return dedup(this.l1Entries, e => e.adapter);
  }

  get l2(): AlovaGlobalCacheAdapter[] {
    return dedup(this.l2Entries, e => e.adapter);
  }
}

export const cacheManager = new CacheAdapterManager();
