export async function executeWithDeadline<T>(work: (signal: AbortSignal) => T | Promise<T>, milliseconds: number, parent?: AbortSignal): Promise<T> {
  if (!Number.isFinite(milliseconds) || milliseconds <= 0) throw new Error("Invalid role deadline");
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let rejectBoundary: (reason: Error) => void;
  const boundary = new Promise<never>((_, reject) => { rejectBoundary = reject; });
  const abort = () => {
    controller.abort();
    rejectBoundary(new Error("agent_cancelled: execution cancelled"));
  };
  parent?.addEventListener("abort", abort, { once: true });
  try {
    if (parent?.aborted) abort();
    else timer = setTimeout(() => {
      controller.abort();
      rejectBoundary(new Error("agent_timeout: role exceeded its execution limit"));
    }, milliseconds);
    return await Promise.race([boundary, Promise.resolve().then(() => {
      if (controller.signal.aborted) throw new Error("agent_cancelled: execution cancelled");
      return work(controller.signal);
    })]);
  } finally {
    clearTimeout(timer);
    parent?.removeEventListener("abort", abort);
  }
}

export function abortableDelay(milliseconds: number, signal?: AbortSignal) {
  if (signal?.aborted) return Promise.reject(new Error("agent_cancelled: execution cancelled"));
  if (milliseconds === 0) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const abort = () => { clearTimeout(timer); reject(new Error("agent_cancelled: execution cancelled")); };
    const timer = setTimeout(() => { signal?.removeEventListener("abort", abort); resolve(); }, milliseconds);
    signal?.addEventListener("abort", abort, { once: true });
    if (signal?.aborted) abort();
  });
}
