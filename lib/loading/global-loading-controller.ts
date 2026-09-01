export const ROUTE_LOADING_TOKEN = "route-navigation";

export type GlobalLoadingListener = (activeCount: number) => void;

export function createGlobalLoadingController() {
  let sequence = 0;
  const operations = new Set<string>();
  const listeners = new Set<GlobalLoadingListener>();

  function emit() {
    const count = operations.size;
    for (const listener of listeners) {
      listener(count);
    }
  }

  return {
    subscribe(listener: GlobalLoadingListener): () => void {
      listeners.add(listener);
      listener(operations.size);
      return () => {
        listeners.delete(listener);
      };
    },
    getActiveCount() {
      return operations.size;
    },
    isActive() {
      return operations.size > 0;
    },
    start(token?: string) {
      const id = token ?? `op-${++sequence}`;
      operations.add(id);
      emit();
      return id;
    },
    stop(token: string) {
      if (!operations.delete(token)) return;
      emit();
    },
    reset() {
      if (operations.size === 0) return;
      operations.clear();
      emit();
    },
    async withLoading<T>(operation: () => Promise<T>): Promise<T> {
      const token = this.start();
      try {
        return await operation();
      } finally {
        this.stop(token);
      }
    },
  };
}

export type GlobalLoadingController = ReturnType<
  typeof createGlobalLoadingController
>;
