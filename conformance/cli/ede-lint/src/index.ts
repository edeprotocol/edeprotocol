#!/usr/bin/env node
import fs from "fs";
import path from "path";
import crypto from "crypto";
import Ajv, { DefinedError } from "ajv";
import canonicalize from "canonicalize";

interface SignatureEntry {
  suite: string;
  signer?: string;
  signature?: string;
  [key: string]: unknown;
}

function usage(): never {
  console.error("Usage: ede-lint <schema.json> <document.json>");
  process.exit(1);
}

function readJson(filePath: string): unknown {
  const content = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(content);
}

function hashCanonicalJson(data: unknown): string {
  const canonical = canonicalize(data);
  if (!canonical) {
    throw new Error("Failed to canonicalize input");
  }
  return crypto.createHash("sha256").update(canonical, "utf8").digest("hex");
}

function validateSignatures(doc: any): string[] {
  const errors: string[] = [];
  if (!doc.signatures || !Array.isArray(doc.signatures) || doc.signatures.length === 0) {
    errors.push("signatures array is required for conformance");
    return errors;
  }

  const suitePattern = /^[A-Z0-9_\-]{3,64}$/;
  doc.signatures.forEach((sig: SignatureEntry, idx: number) => {
    if (!sig.suite || typeof sig.suite !== "string" || !suitePattern.test(sig.suite)) {
      errors.push(`signatures[${idx}].suite must be a non-empty string matching ${suitePattern}`);
    }
    if (sig.signature && typeof sig.signature !== "string") {
      errors.push(`signatures[${idx}].signature must be a string when present`);
    }
    if (sig.signer && typeof sig.signer !== "string") {
      errors.push(`signatures[${idx}].signer must be a string when present`);
    }
  });

  return errors;
}

function main(): void {
  const args = process.argv.slice(2);
  if (args.length < 2) usage();

  const [schemaPath, documentPath] = args.map((p) => path.resolve(p));
  const schema = readJson(schemaPath);
  const document = readJson(documentPath);

  const ajv = new Ajv({ allErrors: true, strict: false });
  const validate = ajv.compile(schema);
  const valid = validate(document);

  if (!valid) {
    console.error("Schema validation failed:\n");
    (validate.errors as DefinedError[]).forEach((err) => {
      console.error(`- ${err.instancePath || "/"} ${err.message}`);
    });
    process.exit(2);
  }

  const signatureErrors = validateSignatures(document as any);
  if (signatureErrors.length > 0) {
    console.error("Signature profile violations:\n");
    signatureErrors.forEach((err) => console.error(`- ${err}`));
    process.exit(3);
  }

  const hash = hashCanonicalJson(document);
  console.log(JSON.stringify({
    status: "ok",
    schema: path.basename(schemaPath),
    document: path.basename(documentPath),
    sha256: hash
  }, null, 2));
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }
}
