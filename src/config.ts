import path from "path";
import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: Number(process.env.PORT) || 3000,
  openaiApiKey: process.env.OPENAI_API_KEY || "",
  protoDir: path.resolve(__dirname, "..", "proto", "autogen-proto"),
  protoMainFile: "propresenter.proto",
  templatePath: path.resolve(__dirname, "..", "default_template_billingual.pro"),
  tempDir: path.resolve(__dirname, "..", ".tmp"),
  outputDir: path.resolve(__dirname, "..", "output"),
};
