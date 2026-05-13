const form = document.querySelector("#diagnose-form");
const button = document.querySelector("#run-button");
const statusText = document.querySelector("#status");
const riskPill = document.querySelector("#risk-pill");
const summary = document.querySelector("#summary");
const reportOutput = document.querySelector("#report");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setBusy(true);

  try {
    const formData = new FormData(form);
    const payload = {
      vin: optionalString(formData.get("vin")),
      year: optionalNumber(formData.get("year")),
      make: optionalString(formData.get("make")),
      model: optionalString(formData.get("model")),
      mileage: optionalNumber(formData.get("mileage")),
      dtcs: splitList(formData.get("dtcs")),
      symptoms: splitList(formData.get("symptoms")),
      includeNetworkEvidence: formData.get("includeNetworkEvidence") === "on",
      ai: formData.get("ai") === "on"
    };

    const response = await fetch("/api/diagnose", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error ?? "Diagnosis failed");
    }

    renderResult(result);
  } catch (error) {
    statusText.textContent = "Error";
    riskPill.textContent = "Error";
    riskPill.className = "status-pill critical";
    reportOutput.textContent = error instanceof Error ? error.message : String(error);
  } finally {
    setBusy(false);
  }
});

function renderResult(result) {
  const report = result.report;
  const vehicle = [report.vehicle.year, report.vehicle.make, report.vehicle.model].filter(Boolean).join(" ") || "Unknown";
  const topRisk = report.safety?.[0]?.level ?? "low";

  statusText.textContent = result.aiWarning ? "Generated with warning" : "Generated";
  riskPill.textContent = topRisk.toUpperCase();
  riskPill.className = `status-pill ${topRisk}`;
  reportOutput.textContent = [result.aiWarning, result.markdown].filter(Boolean).join("\n\n");

  summary.innerHTML = "";
  for (const metric of [
    ["Vehicle", vehicle],
    ["DTCs", report.dtcs.length ? report.dtcs.map((dtc) => dtc.code).join(", ") : "None"],
    ["Plan steps", String(report.plan.length)],
    ["Evidence", String(report.evidence.length)]
  ]) {
    const item = document.createElement("div");
    item.className = "metric";
    item.innerHTML = `<span>${escapeHtml(metric[0])}</span><strong>${escapeHtml(metric[1])}</strong>`;
    summary.append(item);
  }
}

function setBusy(isBusy) {
  button.disabled = isBusy;
  statusText.textContent = isBusy ? "Running diagnosis" : statusText.textContent;
}

function optionalString(value) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : undefined;
}

function optionalNumber(value) {
  const text = String(value ?? "").trim();
  if (!text) {
    return undefined;
  }
  const number = Number.parseInt(text, 10);
  return Number.isFinite(number) ? number : undefined;
}

function splitList(value) {
  return String(value ?? "")
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
