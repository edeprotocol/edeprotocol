#!/usr/bin/env node
import fs from "fs";
import path from "path";
import crypto from "crypto";
import Ajv, { DefinedError } from "ajv";
import canonicalize from "canonicalize";
import glob from "glob";
import { spawnSync } from "child_process";

interface LintResult {
  file: string;
  schema: string;
  ok: boolean;
  errors?: string[];
}

interface SidecarSignature {
  suite: string;
  signer?: string;
  signature?: string;
  [key: string]: unknown;
}

function readJson(filePath: string): any {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function canonicalHash(obj: unknown): string {
  const canon = canonicalize(obj);
  if (!canon) throw new Error("unable to canonicalize");
  return crypto.createHash("sha256").update(canon, "utf8").digest("hex");
}

function schemaRegistry(): Record<string, string> {
  const root = path.resolve(__dirname, "../../../..", "schemas");
  const entries: Record<string, string> = {};
  const files = glob.sync("**/*.schema.json", { cwd: root, absolute: true });
  files.forEach((f) => {
    const data = readJson(f);
    const id = data.$id || path.basename(f);
    entries[id] = f;
  });
  return entries;
}

function detectSchema(doc: any, registry: Record<string, string>): string | undefined {
  if (doc.$schema && registry[doc.$schema]) return doc.$schema;
  if (doc.type) {
    const key = Object.keys(registry).find((k) => k.toLowerCase().includes(doc.type.toLowerCase()));
    if (key) return key;
  }
  if (doc.substrate_id && doc.io_profile) return "https://schema.edeprotocol.org/nir_v2.schema.json";
  if (doc.intent && doc.payload) return "https://schema.edeprotocol.org/nil_intent_v2.schema.json";
  if (Array.isArray(doc.events)) return "https://schema.edeprotocol.org/csl_session_v2.schema.json";
  return undefined;
}

function loadSchema(schemaId: string, registry: Record<string, string>): any {
  const target = registry[schemaId];
  if (!target) throw new Error(`schema not found: ${schemaId}`);
  return readJson(target);
}

function compileAjv(schema: any): Ajv {
  const ajv = new Ajv({ allErrors: true, strict: false });
  ajv.addSchema(schema);
  return ajv;
}

function validateFile(file: string, registry: Record<string, string>): LintResult {
  const doc = readJson(file);
  const schemaId = detectSchema(doc, registry);
  if (!schemaId) return { file, schema: "unknown", ok: false, errors: ["schema_not_detected"] };
  const schema = loadSchema(schemaId, registry);
  const ajv = compileAjv(schema);
  const validate = ajv.getSchema(schemaId) || ajv.compile(schema);
  const valid = validate(doc);
  if (!valid) {
    return {
      file,
      schema: schemaId,
      ok: false,
      errors: (validate.errors as DefinedError[]).map((e) => `${e.instancePath || "/"} ${e.message}`),
    };
  }
  return { file, schema: schemaId, ok: true };
}

function findSidecar(file: string): string | undefined {
  const base = file.replace(/\.json$/, "");
  const candidate = `${base}.sig.json`;
  if (fs.existsSync(candidate)) return candidate;
  return undefined;
}

function verifySignature(doc: any, sidecarPath?: string): string[] {
  if (!sidecarPath) return ["signature_missing"];
  const sig = readJson(sidecarPath) as SidecarSignature;
  if (!sig.suite || typeof sig.suite !== "string") return ["invalid_signature_suite"];
  // placeholder: only structural check
  return [];
}

function walkInputs(target: string): string[] {
  const stats = fs.statSync(target);
  if (stats.isDirectory()) {
    return glob.sync("**/*.json", { cwd: target, absolute: true });
  }
  return [path.resolve(target)];
}

function validateCommand(target: string, registry: Record<string, string>): number {
  const files = walkInputs(target);
  const results = files.map((f) => validateFile(f, registry));
  results.forEach((r) => {
    if (r.ok) {
      console.log(`${r.file}: OK (${r.schema})`);
    } else {
      console.error(`${r.file}: FAIL (${r.schema})`);
      (r.errors || []).forEach((e) => console.error(`  - ${e}`));
    }
  });
  return results.some((r) => !r.ok) ? 1 : 0;
}

function verifyCommand(target: string, registry: Record<string, string>, requireSig = false): number {
  const files = walkInputs(target);
  let exitCode = 0;
  files.forEach((file) => {
    const validation = validateFile(file, registry);
    if (!validation.ok) {
      exitCode = 1;
      console.error(`${file}: validation failed`);
      (validation.errors || []).forEach((e) => console.error(`  - ${e}`));
      return;
    }
    const sidecar = findSidecar(file);
    const sigErrors = verifySignature(readJson(file), sidecar);
    if (sigErrors.length > 0 && requireSig) {
      exitCode = 1;
      console.error(`${file}: signature check failed`);
      sigErrors.forEach((e) => console.error(`  - ${e}`));
    } else {
      console.log(`${file}: verified (${validation.schema}) hash=${canonicalHash(readJson(file))}`);
    }
  });
  return exitCode;
}

function usage(): never {
  console.error("Usage: ede-lint <validate|verify> <path> [--require-sig]");
  process.exit(1);
}

function main(): void {
  const args = process.argv.slice(2);
  if (args.length < 2) usage();
  const command = args[0];
  const target = path.resolve(args[1]);
  const requireSig = args.includes("--require-sig");
  const registry = schemaRegistry();

  let exitCode = 0;
  if (command === "validate") {
    exitCode = validateCommand(target, registry);
  } else if (command === "verify") {
    exitCode = verifyCommand(target, registry, requireSig);
  } else {
    usage();
  }
  process.exit(exitCode);
}

if (require.main === module) {
  main();
}
