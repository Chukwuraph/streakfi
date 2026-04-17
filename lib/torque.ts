import type { StreakEvent, StreakEventType } from "./types";

const INGEST_URL = process.env.TORQUE_INGEST_URL ?? "https://ingest.torque.so/events";
const API_KEY = process.env.TORQUE_API_KEY;

export interface TorqueEventPayload {
  userPubkey: string;
  eventName: StreakEventType | string;
  timestamp?: number;
  data?: Record<string, string | number | boolean>;
}

export interface TorqueEmitResult {
  ok: boolean;
  emitted: boolean;
  status?: number;
  error?: string;
}

/**
 * Emits a custom event to Torque's ingest endpoint.
 * If no API key is configured, the event is recorded locally only (dev mode).
 */
export async function emitTorqueEvent(payload: TorqueEventPayload): Promise<TorqueEmitResult> {
  if (!API_KEY) {
    return { ok: true, emitted: false, error: "TORQUE_API_KEY not configured; local-only mode" };
  }
  try {
    const res = await fetch(INGEST_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
      },
      body: JSON.stringify({
        userPubkey: payload.userPubkey,
        timestamp: payload.timestamp ?? Date.now(),
        eventName: payload.eventName,
        data: payload.data ?? {},
      }),
    });
    return { ok: res.ok, emitted: res.ok, status: res.status };
  } catch (err) {
    return { ok: false, emitted: false, error: (err as Error).message };
  }
}

export function toTorquePayload(event: StreakEvent): TorqueEventPayload {
  return {
    userPubkey: event.wallet,
    eventName: event.type,
    timestamp: event.timestamp,
    data: event.data,
  };
}

export const TORQUE_CONFIGURED = Boolean(API_KEY);
