import crypto from "node:crypto";
import type { IdentityStatus } from "../types/domain.js";
import type { ResolvedPluginConfig } from "../config/schema.js";
import { getIdentityStatus } from "../config/validation.js";

export class IdentityManager {
  constructor(private readonly config: ResolvedPluginConfig) {}

  status(): IdentityStatus {
    return getIdentityStatus(this.config);
  }

  verify(): {
    ok: boolean;
    status: IdentityStatus;
    nextSteps: string[];
  } {
    const status = this.status();
    const nextSteps: string[] = [];

    if (status.mode === "local") {
      nextSteps.push("Local mode is ready. Import existing sessions if you want continuity from prior work.");
    } else if (!status.configured) {
      nextSteps.push("Provide identityKey or memorySpaceId before reconnect mode can restore the same memory space.");
    } else {
      nextSteps.push("Identity is configured. Import old session files next so the restored memory space has useful history.");
      if (!status.apiKeyPresent && status.mode === "cloud") {
        nextSteps.push("Add an API key if your remote backend requires one for reachability checks.");
      }
    }

    return {
      ok: status.mode === "local" || status.reconnectReady,
      status,
      nextSteps,
    };
  }

  generateIdentityKey(): string {
    return `recall_${crypto.randomBytes(12).toString("hex")}`;
  }
}
