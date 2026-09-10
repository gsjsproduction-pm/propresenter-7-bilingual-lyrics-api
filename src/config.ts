import dotenv from "dotenv";
import path from "path";

dotenv.config();

export const config = {
  port: Number(process.env.PORT) || 3000,
  openaiApiKey: process.env.OPENAI_API_KEY || "",
  protoDir: process.env.PROTO_DIR || path.join(__dirname, "..", "proto", "autogen-proto"),
  protoMainFile: process.env.PROTO_MAIN_FILE || "propresenter.proto",
  templatePath: process.env.TEMPLATE_PATH || path.join(__dirname, "..", "default_template_billingual.pro"),
  tempDir: process.env.TEMP_DIR || path.join(__dirname, "..", ".tmp"),
  outputDir: process.env.OUTPUT_DIR || path.join(__dirname, "..", "output"),
};
