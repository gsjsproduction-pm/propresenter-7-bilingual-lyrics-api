import { Router } from "express";
import multer from "multer";
import { fromTextHandler } from "../controllers/fromText.controller";
import { fromProHandler } from "../controllers/fromPro.controller";
import { asyncHandler } from "../utils/asyncHandler";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

export const presentationRouter = Router();

/**
 * @openapi
 * /api/presentations/from-text:
 *   post:
 *     tags: [presentations]
 *     summary: Generate a bilingual presentation from raw lyrics text
 *     description: >
 *       Splits `lyricsText` into non-empty lines (one line = one slide/cue), detects
 *       Indonesian vs. English per line, translates each into the other language, then
 *       clones the bundled bilingual template once per line to build a new `.pro`
 *       presentation.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FromTextRequest'
 *     responses:
 *       '200':
 *         $ref: '#/components/responses/ProFile'
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '500':
 *         $ref: '#/components/responses/ServerError'
 */
presentationRouter.post("/from-text", asyncHandler(fromTextHandler));

/**
 * @openapi
 * /api/presentations/from-pro:
 *   post:
 *     tags: [presentations]
 *     summary: Fill in the missing translation on an existing .pro presentation
 *     description: >
 *       Decodes the uploaded `.pro` file, and for every cue whose primary (fs104) lyric
 *       line has text but whose secondary (fs74) line is empty, translates the primary
 *       line and fills in the secondary. Cues that already have both lines are left
 *       untouched.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/FromProRequest'
 *           encoding:
 *             file:
 *               contentType: application/octet-stream
 *     responses:
 *       '200':
 *         $ref: '#/components/responses/ProFile'
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '500':
 *         $ref: '#/components/responses/ServerError'
 */
presentationRouter.post("/from-pro", upload.single("file"), asyncHandler(fromProHandler));
