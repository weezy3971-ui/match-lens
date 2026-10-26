import { execFile } from "node:child_process";
import { resolve } from "node:path";
import { createMatchServer } from "./http.ts";
import { responsesEndpoint } from "./foundry.ts";

const endpoint = process.env.AZURE_AI_PROJECT_ENDPOINT;
const deployment = process.env.AZURE_MODEL_DEPLOYMENT_NAME;
if (Boolean(endpoint) !== Boolean(deployment)) throw new Error("Set both Foundry project endpoint and model deployment");
if (endpoint) responsesEndpoint(endpoint);
const accessToken = (signal: AbortSignal) => new Promise<string>((resolveToken, reject) => {
  const args = ["account", "get-access-token", "--scope", "https://ai.azure.com/.default", "--query", "accessToken", "-o", "tsv"];
  const executable = process.platform === "win32" ? "cmd.exe" : "az";
  const commandArgs = process.platform === "win32" ? ["/d", "/s", "/c", `az ${args.join(" ")}`] : args;
  execFile(executable, commandArgs, { signal, timeout: 15_000, maxBuffer: 64_000, windowsHide: true }, (error, stdout) => {
    if (error || !stdout.trim()) return reject(new Error("Azure CLI credential unavailable; sign in locally"));
    resolveToken(stdout.trim());
  });
});
const server = createMatchServer({ dist: resolve("dist"), foundry: endpoint && deployment ? { projectEndpoint: endpoint, deployment, accessToken } : undefined });
server.listen(4174, "127.0.0.1", () => console.log("MatchLens service: http://127.0.0.1:4174 (local only)"));
server.headersTimeout = 10_000;
server.requestTimeout = 15_000;
