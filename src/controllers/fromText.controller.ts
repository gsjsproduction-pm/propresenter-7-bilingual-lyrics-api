import { Request, Response } from "express";
import fs from "fs/promises";
import { config } from "../config";
import { decodePresentation, encodePresentation } from "../services/proto.service";
import { buildPresentationFromLines } from "../services/templateBuilder.service";
import { translateLinesIdEn } from "../services/translate.service";
import { saveOutputFile } from "../utils/tempfile";

let templateDecodedTextCache: string | null = null;
async function getTemplateDecodedText(): Promise<string> {
  if (!templateDecodedTextCache) {
    const templateBuffer = await fs.readFile(config.templatePath);
    templateDecodedTextCache = await decodePresentation(templateBuffer);
  }
  return templateDecodedTextCache;
}

export async function fromTextHandler(req: Request, res: Response): Promise<void> {
  const { lyricsText, fileName, additionalContextEn } = req.body as {
    lyricsText?: unknown;
    fileName?: unknown;
    additionalContextEn?: unknown;
  };

  if (typeof lyricsText !== "string" || lyricsText.trim() === "") {
    res.status(400).json({ error: "lyricsText is required" });
    return;
  }
  if (typeof fileName !== "string" || fileName.trim() === "") {
    res.status(400).json({ error: "fileName is required" });
    return;
  }

  const lines = lyricsText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== "");

  if (lines.length === 0) {
    res.status(400).json({ error: "lyricsText contains no non-empty lines" });
    return;
  }

  const translated = await translateLinesIdEn(
    lines,
    typeof additionalContextEn === "string" ? additionalContextEn : undefined,
  );
  const templateDecodedText = await getTemplateDecodedText();

  const bilingualLines = translated.map((t) => ({
    primaryText: t.original,
    secondaryText: t.translation,
  }));

  const decodedOutput = buildPresentationFromLines(templateDecodedText, bilingualLines);
  const proBuffer = await encodePresentation(decodedOutput);

  const safeName = fileName.trim().replace(/[\\/:*?"<>|]/g, "_");
  if (process.env.NODE_ENV === "local") {
    const savedPath = await saveOutputFile(`${safeName}.pro`, proBuffer);
    console.log(`Saved presentation to ${savedPath}`);
  }

  res.setHeader("Content-Type", "application/octet-stream");
  const originalFilename = `${fileName.replace(/\.pro$/i, "")}.pro`;
  const encodedFilename = encodeURIComponent(originalFilename);
  res.setHeader("Content-Disposition", `attachment; filename="${safeName}.pro"; filename*=UTF-8''${encodedFilename}`);
  res.send(proBuffer);
}
