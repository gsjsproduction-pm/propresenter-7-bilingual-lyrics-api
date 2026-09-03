# ProPresenter Bilingual API

Express + TypeScript API that generates bilingual (Indonesian/English) ProPresenter 7 `.pro`
presentations, using an LLM (via [OpenRouter](https://openrouter.ai) with OpenAI GPT 4o Mini) to detect the language
of each lyric line and translate it into the other language.

Two ways in:

- **From raw lyrics text** — splits pasted lyrics into lines, translates each, and clones a
  bundled bilingual template once per line to build a brand-new presentation.
- **From an existing `.pro` file** — decodes the upload and fills in only the missing secondary
  (translated) line on cues that have a primary lyric but no translation yet; cues that are
  already bilingual are left untouched.

Presentation files are decoded/encoded via the local [`protoc`](https://protobuf.dev/) CLI
against ProPresenter's own `.proto` definitions (see [Reference](#reference)).

## Requirements

- Node.js
- [`protoc`](https://protobuf.dev/) available on `PATH`
- An OpenRouter API key (or any OpenAI-compatible key, by pointing `baseURL` elsewhere in
  `src/services/translate.service.ts`)

## Setup

```bash
npm install
cp .env.example .env   # then set OPENAI_API_KEY
npm run dev            # http://localhost:3000
```

- `npm run dev` — run with hot reload (`tsx watch`)
- `npm run build` — type-check + compile to `dist/`
- `npm start` — run the compiled build

## API docs

Interactive Swagger UI: **http://localhost:3000/docs**
Raw OpenAPI spec: **http://localhost:3000/openapi.json**

### `POST /api/presentations/from-text`

`application/json` body:

| Field                 | Type   | Required | Description                                                   |
| --------------------- | ------ | -------- | --------------------------------------------------------------- |
| `lyricsText`          | string | yes      | Raw lyrics, one line per newline. Blank lines are ignored.      |
| `fileName`             | string | yes      | Output base file name (without extension).                     |
| `additionalContextEn` | string | no       | Optional English guidance (title, theme, tone) for the model.   |

> Pasting multi-line lyrics directly into Swagger UI's JSON editor embeds literal newlines
> inside a string value, which is invalid JSON — a `requestInterceptor` wired into `/docs`
> escapes those into `\n` automatically, scoped to this endpoint only.

### `POST /api/presentations/from-pro`

`multipart/form-data` body:

| Field                 | Type   | Required | Description                                                        |
| --------------------- | ------ | -------- | -------------------------------------------------------------------- |
| `file`                | binary | yes      | Existing ProPresenter 7 `.pro` file to translate.                    |
| `fileName`            | string | no       | Output base file name. Defaults to the uploaded file's own name.    |
| `additionalContextEn` | string | no       | Optional English guidance for the model.                             |

Both endpoints stream the generated `.pro` back as a download **and** save a copy to the
project's local `output/` folder for on-machine testing.

## Project layout

```
src/
  config.ts                        # env, proto dir/template/output paths
  index.ts                         # express app + swagger mount
  swagger.ts                       # OpenAPI schema/components
  routes/presentation.routes.ts    # routes + @openapi doc comments
  controllers/                     # from-text / from-pro request handlers
  services/
    proto.service.ts               # protoc decode/encode (spawns the CLI)
    braceScanner.ts                # string-literal-aware brace matching for protoc text format
    rtf.service.ts                 # read/write the lyric text inside an rtf_data field
    cue.service.ts                 # clone a cue block with fresh UUIDs
    templateBuilder.service.ts     # build a full presentation from lines + the template
    proFiller.service.ts           # fill missing translations in an uploaded presentation
    translate.service.ts           # LLM translation call (OpenRouter)
  utils/
proto/autogen-proto/                # ProPresenter's .proto definitions (propresenter.proto is the entry point)
default_template_billingual.pro     # bundled template used by /from-text
```

## Reference

- [greyshirtguy/ProPresenter7-Proto](https://github.com/greyshirtguy/ProPresenter7-Proto) —
  reverse-engineered ProPresenter 7 `.proto` definitions this project decodes/encodes against.
- [`BILINGUAL_LYRICS_GUIDE.md`](./BILINGUAL_LYRICS_GUIDE.md) — notes on the bilingual `rtf_data`
  layout (`fs104`/`fs74`, the `\nosupersub` marker) that the RTF/cue services implement against.
