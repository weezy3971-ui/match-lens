import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, sep, extname } from "node:path";
import { matchScenarios } from "../data/scenarios.ts";
import { matchThroughMoment } from "../analytics/momentWindow.ts";
import { analyzeGoalSequence } from "../analytics/matchIntelligence.ts";
import { orchestrateMoment } from "../agents/orchestrator.ts";
import { foundryRoles } from "./roles.ts";
import type { FoundryConfig, FoundryTrace } from "./foundry.ts";

export function createMatchServer(options: { foundry?: FoundryConfig; dist?: string } = {}) {
  let active = 0;
  let windowStart = Date.now();
  let requests = 0;
  return createServer(async (req, res) => {
    res.setHeader("cache-control", "no-store");
    res.setHeader("x-content-type-options", "nosniff");
    res.setHeader("content-security-policy", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'");
    const send = (status: number, value: unknown) => { if (!res.destroyed) { res.writeHead(status, { "content-type": "application/json" }); res.end(JSON.stringify(value)); } };
    const host = req.headers.host ?? "";
    if (!/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(host)) return send(403, { error: "Invalid host" });
    if (req.headers.origin && req.headers.origin !== `http://${host}`) return send(403, { error: "Cross-origin request rejected" });
    if (req.url === "/api/status" && req.method === "GET") return send(200, { foundryConfigured: Boolean(options.foundry), liveExecutionVerified: false });
    if (req.url !== "/api/explain") {
      if (req.method !== "GET" || !options.dist || req.url?.startsWith("/api/")) return send(404, { error: "Not found" });
      try {
        const path = decodeURIComponent(new URL(req.url ?? "/", "http://localhost").pathname);
        const base = resolve(options.dist);
        const file = resolve(base, `.${path === "/" ? "/index.html" : path}`);
        if (!file.startsWith(`${base}${sep}`)) return send(403, { error: "Invalid path" });
        const types: Record<string, string> = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".txt": "text/plain" };
        const bytes = await readFile(file);
        res.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream" });
        res.end(bytes);
      } catch { send(404, { error: "Not found" }); }
      return;
    }
    if (req.method !== "POST") return send(405, { error: "Use POST" });
    if (!req.headers["content-type"]?.startsWith("application/json")) return send(415, { error: "Use application/json" });
    if (active >= 2) return send(429, { error: "Service busy" });
    if (Date.now() - windowStart > 60_000) { windowStart = Date.now(); requests = 0; }
    if (++requests > 12) return send(429, { error: "Request budget exhausted; retry later" });
    active += 1;
    const controller = new AbortController();
    const deadline = setTimeout(() => controller.abort(), 95_000);
    const disconnect = () => { if (!res.writableEnded) controller.abort(); };
    res.on("close", disconnect);
    req.on("aborted", disconnect);
    try {
      let bytes = 0;
      let body = "";
      for await (const chunk of req) {
        bytes += chunk.length;
        if (bytes > 4096) { send(413, { error: "Request too large" }); return; }
        body += chunk.toString("utf8");
      }
      let input: Record<string, unknown>;
      try { input = JSON.parse(body); } catch { return send(400, { error: "Invalid JSON" }); }
      if (!input || typeof input !== "object" || Array.isArray(input) || Object.keys(input).some((key) => !["scenarioId", "anchorEventId", "audience", "execution"].includes(key)) || typeof input.scenarioId !== "string" || !input.scenarioId || (input.audience !== "analyst" && input.audience !== "fan") || (input.execution !== "local" && input.execution !== "foundry") || (input.anchorEventId !== undefined && (typeof input.anchorEventId !== "string" || !input.anchorEventId))) return send(400, { error: "Invalid request" });
      const source = matchScenarios.find(({ match }) => match.id === input.scenarioId)?.match;
      if (!source) return send(400, { error: "Unknown scenario" });
      if (input.execution === "foundry" && !options.foundry) return send(503, { error: "Foundry is not configured" });
      let match;
      try { match = input.anchorEventId ? matchThroughMoment(source, String(input.anchorEventId)) : source; }
      catch { return send(400, { error: "Moment lacks valid possession history" }); }
      const analysis = analyzeGoalSequence(match);
      if (analysis.status === "unavailable") return send(422, { error: "Insufficient match evidence" });
      const modelTrace: Array<{ role: string; trace: FoundryTrace[] }> = [];
      const roles = input.execution === "foundry" ? foundryRoles(options.foundry!, match, { onTrace: (role, trace) => modelTrace.push({ role, trace }) }) : {};
      const result = await orchestrateMoment(match, analysis.insight, { ...roles, audienceMode: input.audience as "analyst" | "fan", signal: controller.signal });
      return send(200, { execution: input.execution, result, modelTrace });
    } catch { send(controller.signal.aborted ? 408 : 502, { error: controller.signal.aborted ? "Execution cancelled or timed out" : "Execution failed; inspect server configuration" }); }
    finally { clearTimeout(deadline); active -= 1; res.off("close", disconnect); }
  });
}
