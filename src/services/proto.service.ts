import { spawn } from "child_process";
import { config } from "../config";

function runProtoc(args: string[], stdin: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const proc = spawn("protoc", args, { cwd: config.protoDir });
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];

    proc.stdout.on("data", (chunk) => stdout.push(chunk));
    proc.stderr.on("data", (chunk) => stderr.push(chunk));
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`protoc exited with code ${code}: ${Buffer.concat(stderr).toString()}`));
        return;
      }
      resolve(Buffer.concat(stdout));
    });

    proc.stdin.write(stdin);
    proc.stdin.end();
  });
}

export async function decodePresentation(proBuffer: Buffer): Promise<string> {
  const out = await runProtoc(
    ["-I", ".", "--decode", "rv.data.Presentation", config.protoMainFile],
    proBuffer
  );
  return out.toString("utf8");
}

export async function encodePresentation(decodedText: string): Promise<Buffer> {
  return runProtoc(
    ["-I", ".", "--encode", "rv.data.Presentation", config.protoMainFile],
    Buffer.from(decodedText, "utf8")
  );
}
