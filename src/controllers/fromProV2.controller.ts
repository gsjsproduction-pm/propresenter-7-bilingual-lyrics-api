import { Request, Response } from "express";
import { decodePresentation, encodePresentation } from "../services/proto.service";
import { fillMissingTranslationsV2 } from "../services/proFillerV2.service";
import { saveOutputFile } from "../utils/tempfile";

export async function fromProV2Handler(req: Request, res: Response): Promise<void> {
  const file = req.file;
  if (!file) {
    res.status(400).json({ error: "A .pro file upload is required (field name: file)" });
    return;
  }

  const { fileName: fileNameField, additionalContextEn } = req.body as {
    fileName?: unknown;
    additionalContextEn?: unknown;
  };
  const baseName =
    typeof fileNameField === "string" && fileNameField.trim() !== ""
      ? fileNameField.trim()
      : file.originalname.replace(/\.pro$/i, "");
  const safeName = baseName.replace(/[\\/:*?"<>|]/g, "_");

  const decodedText = await decodePresentation(file.buffer);
  const filledText = await fillMissingTranslationsV2(
    decodedText,
    typeof additionalContextEn === "string" ? additionalContextEn : undefined,
  );
  const proBuffer = await encodePresentation(filledText);

  if (process.env.NODE_ENV === "local") {
    const savedPath = await saveOutputFile(`${safeName} TRANSLATED.pro`, proBuffer);
    console.log(`Saved presentation to ${savedPath}`);
  }

  res.setHeader("Content-Type", "application/octet-stream");
  res.setHeader("Content-Disposition", `attachment; filename="${safeName} TRANSLATED.pro"`);
  res.send(proBuffer);
}
