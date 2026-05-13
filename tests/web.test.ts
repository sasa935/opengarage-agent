import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createOpenGarageServer } from "../src/web/server.js";

const server = createOpenGarageServer();
let baseUrl = "";

beforeAll(async () => {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  server.close();
  await once(server, "close");
});

describe("web server", () => {
  it("serves the web UI", async () => {
    const response = await fetch(`${baseUrl}/`);
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain("OpenGarage Agent");
    expect(html).toContain("Run diagnosis");
  });

  it("generates a diagnostic report through the API", async () => {
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

    const payload = await response.json() as {
      report: {
        dtcs: Array<{ code: string }>;
        plan: Array<{ title: string }>;
      };
      markdown: string;
    };

    expect(response.status).toBe(200);
    expect(payload.report.dtcs.map((dtc) => dtc.code)).toEqual(["P0420", "P0171"]);
    expect(payload.report.plan.some((step) => step.title.includes("Avoid premature catalyst replacement"))).toBe(true);
    expect(payload.markdown).toContain("OpenGarage Diagnostic Report");
  });

  it("keeps the report when optional AI review is unavailable", async () => {
    const response = await fetch(`${baseUrl}/api/diagnose`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        year: 2012,
        make: "Honda",
        model: "Accord",
        dtcs: ["P0420"],
        symptoms: ["check engine light on"],
        includeNetworkEvidence: false,
        ai: true
      })
    });

    const payload = await response.json() as {
      report: {
        dtcs: Array<{ code: string }>;
      };
      aiWarning?: string;
    };

    expect(response.status).toBe(200);
    expect(payload.report.dtcs[0]?.code).toBe("P0420");
    expect(payload.aiWarning).toContain("AI review skipped");
  });
});
