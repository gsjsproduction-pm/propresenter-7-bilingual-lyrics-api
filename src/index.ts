import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { config } from "./config";
import { presentationRouter } from "./routes/presentation.routes";
import { openApiSpec } from "./swagger";

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));

const swaggerCustomCss = `
  .swagger-ui .wrapper { max-width: 1400px; }
  .swagger-ui textarea.body-param__text,
  .swagger-ui textarea {
    width: 100%;
    min-height: 220px;
    font-family: monospace;
  }
`;

/**
 * Swagger UI's "Try it out" JSON body editor sends the raw textarea text as-is.
 * Pasting real (multi-line) lyrics into the `lyricsText` string value therefore
 * embeds literal newline characters inside a JSON string, which is invalid JSON.
 * This escapes raw newlines into "\n" ONLY while inside a string literal —
 * tracking quote state char-by-char — so structural formatting outside strings
 * (and the request body of every other endpoint) is left untouched.
 */
function escapeNewlinesInJsonStringsRequestInterceptor(req: { url?: string; body?: unknown }) {
  if (typeof req.url === "string" && req.url.endsWith("/from-text") && typeof req.body === "string") {
    try {
      let result = "";
      let inString = false;
      const body = req.body;
      for (let i = 0; i < body.length; i++) {
        const ch = body[i];
        if (inString) {
          if (ch === "\\") {
            result += ch + (body[i + 1] ?? "");
            i++;
            continue;
          }
          if (ch === '"') {
            inString = false;
            result += ch;
            continue;
          }
          if (ch === "\r") {
            if (body[i + 1] !== "\n") result += "\\n";
            continue;
          }
          if (ch === "\n") {
            result += "\\n";
            continue;
          }
          result += ch;
          continue;
        }
        if (ch === '"') inString = true;
        result += ch;
      }
      req.body = result;
    } catch (e) {
      console.error("Failed to intercept from-text payload", e);
    }
  }
  return req;
}

app.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(openApiSpec, {
    customCss: swaggerCustomCss,
    swaggerOptions: { requestInterceptor: escapeNewlinesInJsonStringsRequestInterceptor },
  }),
);
app.get("/openapi.json", (_req, res) => res.json(openApiSpec));

app.use("/api/presentations", presentationRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err instanceof Error ? err.message : "Internal server error" });
});

app.listen(config.port, () => {
  console.log(`propresenter-bilingual-api listening on port ${config.port}`);
  console.log(`API docs: http://localhost:${config.port}/docs`);
});
