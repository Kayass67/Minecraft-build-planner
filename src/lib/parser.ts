import { NormalizedSchematic } from './types';

export function parseLitematic(
  buffer: ArrayBuffer,
  onProgress?: (status: string) => void
): Promise<NormalizedSchematic> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error("Parsing is only supported in the browser."));
    }

    try {
      // Use Next.js syntax for Web Workers
      const worker = new Worker(new URL('./parser.worker', import.meta.url), {
        type: 'module'
      });

      worker.onmessage = (e: MessageEvent) => {
        const { type, data, error, status } = e.data;
        if (type === 'progress') {
          if (onProgress) onProgress(status);
        } else if (type === 'success') {
          worker.terminate();
          resolve(data as NormalizedSchematic);
        } else if (type === 'error') {
          worker.terminate();
          reject(new Error(error));
        }
      };

      worker.onerror = (e) => {
        worker.terminate();
        reject(new Error(e.message || "Unknown worker error"));
      };

      // Transfer the buffer to the worker so we don't copy memory
      worker.postMessage(buffer, [buffer]);
    } catch (error: unknown) {
      if (error instanceof Error) {
        reject(new Error(`Failed to initialize Web Worker: ${error.message}`));
      } else {
        reject(new Error(`Failed to initialize Web Worker: ${String(error)}`));
      }
    }
  });
}
