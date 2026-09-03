import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { config } from "../config";

export async function createTempWorkDir(): Promise<string> {
  const dir = path.join(config.tempDir, crypto.randomUUID());
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export async function removeWorkDir(dir: string): Promise<void> {
  await fs.rm(dir, { recursive: true, force: true });
}

/** Persists a generated .pro to the project's local output/ folder for localhost testing. */
export async function saveOutputFile(fileName: string, buffer: Buffer): Promise<string> {
  await fs.mkdir(config.outputDir, { recursive: true });
  const outPath = path.join(config.outputDir, fileName);
  await fs.writeFile(outPath, buffer);
  return outPath;
}
