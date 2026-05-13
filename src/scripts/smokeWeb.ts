import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { createOpenGarageServer } from "../web/server.js";

const server = createOpenGarageServer();

try {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");

  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  const page = await fetch(`${baseUrl}/`);
  if (!page.ok) {
    throw new Error(`Expected index page to load, got ${page.status}`);
  }

  const html = await page.text();
  if (!html.includes("OpenGarage Agent")) {
    throw new Error("Index page did not include the product name.");
  }

  const response = await fetch(`${baseUrl}/api/diagnose`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      year: 2012,
      make: "Honda",
      model: "Accord",
      mileage: 120000,
      dtcs: ["P0420", "P0171"],
      symptoms: ["rough idle", "higher fuel consumption"],
      includeNetworkEvidence: false,
      ai: false
    })
  });

  if (!response.ok) {
    throw new Error(`Expected diagnose API to succeed, got ${response.status}`);
  }

  const payload = await response.json() as { markdown?: string };
  if (!payload.markdown?.includes("Diagnostic Plan")) {
    throw new Error("Diagnose API response did not include a diagnostic report.");
  }

  process.stdout.write(`Web smoke test passed at ${baseUrl}\n`);
} finally {
  server.close();
}
