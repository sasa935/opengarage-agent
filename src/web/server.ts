import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { addLlmCaseReview } from "../agents/llmCaseReviewer.js";
import { diagnoseInputSchema } from "../agents/types.js";
import { createDeepSeekProviderFromEnv } from "../llm/deepseek.js";
import { runDiagnosis } from "../pipeline/diagnose.js";
import { renderMarkdownReport } from "../report/markdown.js";

const rootDir = fileURLToPath(new URL("../../", import.meta.url));
const publicDir = join(rootDir, "public");
const port = Number.parseInt(process.env.PORT ?? "3000", 10);

export function createOpenGarageServer(): Server {
  return createServer(async (request, response) => {
    try {
      if (request.method === "POST" && request.url === "/api/diagnose") {
        await handleDiagnose(request, response);
        return;
      }

      if (request.method === "GET") {
        await handleStatic(request, response);
        return;
      }

      sendJson(response, 405, { error: "Method not allowed" });
    } catch (error) {
      sendJson(response, 500, {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const server = createOpenGarageServer();
  server.listen(port, () => {
    process.stdout.write(`OpenGarage Agent web UI running at http://localhost:${port}\n`);
  });
}

async function handleDiagnose(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const body = await readRequestBody(request);
  const payload = JSON.parse(body || "{}") as unknown;
  const parsed = diagnoseInputSchema.extend({
    ai: diagnoseInputSchema.shape.includeNetworkEvidence.optional().default(false)
  }).parse(payload);

  let report = await runDiagnosis({
    vin: parsed.vin,
    year: parsed.year,
    make: parsed.make,
    model: parsed.model,
    mileage: parsed.mileage,
    dtcs: parsed.dtcs,
    symptoms: parsed.symptoms,
    includeNetworkEvidence: parsed.includeNetworkEvidence
  });

  let aiWarning: string | undefined;
  if (parsed.ai) {
    try {
      report = await addLlmCaseReview(report, createDeepSeekProviderFromEnv());
    } catch (error) {
      aiWarning = `AI review skipped: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  sendJson(response, 200, {
    report,
    markdown: renderMarkdownReport(report),
    aiWarning
  });
}

async function handleStatic(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const requestUrl = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
  const pathname = requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname;
  const normalizedPath = normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  const filePath = join(publicDir, normalizedPath);

  if (!filePath.startsWith(publicDir)) {
    sendText(response, 403, "Forbidden", "text/plain");
    return;
  }

  try {
    const contents = await readFile(filePath);
    sendBuffer(response, 200, contents, contentType(filePath));
  } catch {
    sendText(response, 404, "Not found", "text/plain");
  }
}

async function readRequestBody(request: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

function sendJson(response: ServerResponse, status: number, payload: unknown): void {
  sendText(response, status, JSON.stringify(payload), "application/json");
}

function sendText(response: ServerResponse, status: number, text: string, type: string): void {
  response.writeHead(status, {
    "Content-Type": `${type}; charset=utf-8`,
    "Cache-Control": "no-store"
  });
  response.end(text);
}

function sendBuffer(response: ServerResponse, status: number, contents: Buffer, type: string): void {
  response.writeHead(status, {
    "Content-Type": type,
    "Cache-Control": "no-store"
  });
  response.end(contents);
}

function contentType(filePath: string): string {
  switch (extname(filePath)) {
    case ".html":
      return "text/html; charset=utf-8";
    case ".css":
      return "text/css; charset=utf-8";
    case ".js":
      return "text/javascript; charset=utf-8";
    case ".svg":
      return "image/svg+xml";
    default:
      return "application/octet-stream";
  }
}
