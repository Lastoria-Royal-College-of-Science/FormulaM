import { findFormulas } from "../core/search";
import type { WorkerRequest, WorkerResponse } from "./workerProtocol";

const cancelled = new Set<string>();

self.onmessage = (event: MessageEvent<WorkerRequest>): void => {
  const message = event.data;
  if (message.type === "cancel") {
    cancelled.add(message.requestId);
    return;
  }

  try {
    if (cancelled.has(message.requestId)) return;
    const hits = findFormulas(message.payload);
    if (cancelled.has(message.requestId)) return;
    const response: WorkerResponse = { type: "result", requestId: message.requestId, hits };
    self.postMessage(response);
  } catch (error) {
    const response: WorkerResponse = {
      type: "error",
      requestId: message.requestId,
      message: error instanceof Error ? error.message : String(error),
    };
    self.postMessage(response);
  } finally {
    cancelled.delete(message.requestId);
  }
};
