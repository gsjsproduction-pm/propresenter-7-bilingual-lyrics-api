import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "ProPresenter Bilingual API",
      version: "1.0.0",
      description:
        "Generates bilingual (Indonesian/English) ProPresenter 7 `.pro` presentations. " +
        "One endpoint builds a fresh presentation from raw lyrics text using the bundled " +
        "template; the other fills in the missing translation on an existing `.pro` file. " +
        "Both use an LLM (via OpenRouter) to detect language per line and translate it into " +
        "the other language.",
    },
    servers: [{ url: "/", description: "Local server" }],
    tags: [
      {
        name: "presentations",
        description: "Generate bilingual ProPresenter presentations",
      },
    ],
    components: {
      schemas: {
        FromTextRequest: {
          type: "object",
          required: ["lyricsText", "fileName"],
          properties: {
            lyricsText: {
              type: "string",
              description:
                "Raw lyrics, one logical lyric line per newline. Blank lines are ignored. " +
                "Each non-empty line becomes one slide/cue in the generated presentation.",
              example: "Bangkit s'rukan nama Yesus\nMaju nyatakan kuasa-Nya",
            },
            fileName: {
              type: "string",
              description:
                "Base file name for the generated presentation (without extension). " +
                'Unsafe filesystem characters (\\ / : * ? " < > |) are stripped.',
              example: "bangkit serukan nama Yesus",
            },
            additionalContextEn: {
              type: "string",
              nullable: true,
              description:
                "Optional free-form English guidance passed to the translation model — " +
                "song title, theme, preferred terminology, or tone. Does not change the " +
                "line-in/line-out contract, only steers how each line is translated.",
              example: "This is a triumphant worship anthem; keep the tone declarative and bold.",
            },
          },
        },
        FromProRequest: {
          type: "object",
          required: ["file"],
          properties: {
            file: {
              type: "string",
              format: "binary",
              description: "An existing ProPresenter 7 `.pro` presentation file to upload.",
            },
            fileName: {
              type: "string",
              nullable: true,
              description:
                "Optional base file name for the output (without extension). Defaults to the " +
                'uploaded file\'s own name. The response file is always saved as "<name> TRANSLATED.pro".',
              example: "bangkit serukan nama Yesus",
            },
            additionalContextEn: {
              type: "string",
              nullable: true,
              description:
                "Optional free-form English guidance passed to the translation model for any " +
                "cues that need a translation filled in — song title, theme, terminology, or tone.",
              example: "Youth service set; keep translations casual and conversational.",
            },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            error: { type: "string", example: "lyricsText is required" },
          },
        },
      },
      responses: {
        ProFile: {
          description:
            "The generated/translated ProPresenter `.pro` file, streamed as a binary download. " +
            "A copy is also written to the project's local `output/` folder for on-machine testing.",
          content: {
            "application/octet-stream": {
              schema: { type: "string", format: "binary" },
            },
          },
        },
        BadRequest: {
          description: "Missing or invalid input.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        ServerError: {
          description:
            "Unexpected failure — e.g. protoc decode/encode error, or the translation model call failed.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },
  apis: ["src/routes/*.ts", "dist/routes/*.js"],
};

export const openApiSpec = swaggerJsdoc(options);
