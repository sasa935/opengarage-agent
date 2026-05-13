#!/usr/bin/env node
import { writeFile } from "node:fs/promises";
import { Command } from "commander";
import { addLlmCaseReview } from "./agents/llmCaseReviewer.js";
import { createDeepSeekProviderFromEnv } from "./llm/deepseek.js";
import { runDiagnosis } from "./pipeline/diagnose.js";
import { renderMarkdownReport } from "./report/markdown.js";

type DiagnoseOptions = {
  vin?: string;
  year?: string;
  make?: string;
  model?: string;
  mileage?: string;
  dtc: string[];
  symptom: string[];
  offline?: boolean;
  ai?: boolean;
  aiModel?: string;
  json?: boolean;
  output?: string;
};

const program = new Command();

program
  .name("opengarage")
  .description("Evidence-first diagnostic agent for modern vehicles")
  .version("0.1.0");

program
  .command("diagnose")
  .description("Generate a diagnostic report from vehicle details, DTCs, and symptoms")
  .option("--vin <vin>", "Vehicle identification number")
  .option("--year <year>", "Vehicle model year")
  .option("--make <make>", "Vehicle make")
  .option("--model <model>", "Vehicle model")
  .option("--mileage <mileage>", "Vehicle mileage")
  .option("-d, --dtc <code>", "Diagnostic trouble code; repeat for multiple codes", collect, [])
  .option("-s, --symptom <text>", "Observed symptom; repeat for multiple symptoms", collect, [])
  .option("--offline", "Skip live network evidence lookup")
  .option("--ai", "Add an LLM case review using the configured provider")
  .option("--ai-model <model>", "Override the LLM model for --ai")
  .option("--json", "Print the raw JSON report")
  .option("-o, --output <path>", "Write the report to a file")
  .action(async (options: DiagnoseOptions) => {
    let report = await runDiagnosis({
      vin: options.vin,
      year: parseNumber(options.year),
      make: options.make,
      model: options.model,
      mileage: parseNumber(options.mileage),
      dtcs: options.dtc,
      symptoms: options.symptom,
      includeNetworkEvidence: !options.offline
    });

    if (options.ai) {
      const provider = createDeepSeekProviderFromEnv();
      report = await addLlmCaseReview(report, provider, options.aiModel);
    }

    const rendered = options.json ? `${JSON.stringify(report, null, 2)}\n` : renderMarkdownReport(report);

    if (options.output) {
      await writeFile(options.output, rendered, "utf8");
    } else {
      process.stdout.write(rendered);
      if (!rendered.endsWith("\n")) {
        process.stdout.write("\n");
      }
    }
  });

program.parseAsync().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});

function collect(value: string, previous: string[]): string[] {
  return [...previous, value];
}

function parseNumber(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}
