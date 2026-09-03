# ProPresenter 7 Bilingual Lyrics Adjustment Guide

## Overview
This guide explains how to modify and structure bilingual lyrics (Indonesian and English) in ProPresenter 7 decoded presentation files.

## File Structure

### Main Components
- **File Format**: Protocol Buffer text format (decoded from `.pro` binary)
- **Key Field**: `rtf_data` - Contains RTF (Rich Text Format) encoded lyrics
- **Location**: Inside `cues` → `actions` → `slide` → `presentation` → `base_slide` → `elements` → `element` → `text`

### Cue Structure
Each `cue` represents a slide/scene and contains:
```
cues {
  uuid { string: "..." }
  name: "..." 
  actions {
    slide {
      presentation {
        base_slide {
          elements {
            element {              # FIRST TEXT BLOCK (Indonesian)
              rtf_data: "{...Indonesian text...}"
            }
            info: 3
          }
          elements {
            element {              # SECOND TEXT BLOCK (English)
              rtf_data: "{...English text...}"
            }
            info: 3
          }
        }
      }
    }
  }
}
```

## RTF Data Structure

### RTF Pattern
```
rtf_data: "{\\rtf0\\ansi\\ansicpg1252{\\fonttbl\\f0\\fnil FontName;}{\\colortbl\\...}{\\...formatting...}\\nosupersub ActualTextHere}"
```

### Key Components
| Component | Purpose | Example |
|-----------|---------|---------|
| `\\rtf0` | RTF version | Always `\\rtf0` |
| `\\ansi` | Character set | Always `\\ansi` |
| `\\fonttbl` | Font table | Defines font used |
| `\\colortbl` | Color table | Defines text colors |
| `\\fs104` or `\\fs74` | Font size | 104 = larger, 74 = smaller |
| `\\nosupersub` | Text marker | Precedes actual text |
| `}` | Closing bracket | End of RTF string |

### Font Sizes
- `\\fs104` - Large font (52pt) - Usually for first line/Indonesian
- `\\fs74` - Medium font (37pt) - Usually for second line/English

## Bilingual Layout Pattern

### Standard Two-Line Layout
```
Element 1 (Indonesian):
- Font size: fs104 (52pt) or fs104 (52pt)
- Position: y: 869.1
- Height: 170.72368317470944

Element 2 (English):
- Font size: fs74 (37pt) or fs74 (37pt)
- Position: y: 920.3
- Height: 170.72368317470932
```

### Text Positioning
```
bounds {
  origin {
    y: 869.1      # Indonesian text (higher on screen)
  }
  size {
    width: 1920
    height: 170.72368317470944
  }
}

bounds {
  origin {
    y: 920.3      # English text (lower on screen)
  }
  size {
    width: 1920
    height: 170.72368317470932
  }
}
```

## Modifying Bilingual Lyrics

### Step 1: Identify the Text Block
1. Open `decoded_lyrics_copy.txt`
2. Find the `cue` section you want to modify
3. Locate two consecutive `element` blocks within `base_slide`

### Step 2: Locate the RTF Data
Look for the pattern:
```
rtf_data: "{\\rtf0\\ansi\\ansicpg1252...\\nosupersub ActualText}"
```

### Step 3: Extract the Text
Text appears AFTER `\\nosupersub ` and BEFORE `}`

Example:
```
\\nosupersub Firman terangi jalan ku}     ← Indonesian text
\\nosupersub Your Word illuminates my way} ← English text
```

### Step 4: Replace Text
To replace existing text:
1. Keep ALL RTF formatting intact
2. Change ONLY the text after `\\nosupersub `
3. Ensure closing `}` remains at the end

**Example:**
```
OLD: rtf_data: "{\\rtf0\\ansi\\ansicpg1252{...\\nosupersub Firman terangi jalan ku}"

NEW: rtf_data: "{\\rtf0\\ansi\\ansicpg1252{...\\nosupersub Firman cahaya hidupku}"
```

## Complete Example

### Before Modification
```
cues {
  uuid { string: "b1da4c32-6fca-48d7-8e35-d9620b1d414e" }
  actions {
    slide {
      presentation {
        base_slide {
          elements {
            element {
              bounds { origin { y: 869.1 } size { width: 1920 height: 170.72 } }
              text {
                rtf_data: "{\\rtf0\\ansi\\ansicpg1252...\\fs104\\...\\nosupersub Firman terangi jalan ku}"
              }
            }
            info: 3
          }
          elements {
            element {
              bounds { origin { y: 920.3 } size { width: 1920 height: 170.72 } }
              text {
                rtf_data: "{\\rtf0\\ansi\\ansicpg1252...\\fs74\\...\\nosupersub Your Word illuminates my way}"
              }
            }
            info: 3
          }
        }
      }
    }
  }
}
```

### After Modification
```
cues {
  uuid { string: "b1da4c32-6fca-48d7-8e35-d9620b1d414e" }
  actions {
    slide {
      presentation {
        base_slide {
          elements {
            element {
              bounds { origin { y: 869.1 } size { width: 1920 height: 170.72 } }
              text {
                rtf_data: "{\\rtf0\\ansi\\ansicpg1252...\\fs104\\...\\nosupersub Cahaya terangi perjalanan}"
              }
            }
            info: 3
          }
          elements {
            element {
              bounds { origin { y: 920.3 } size { width: 1920 height: 170.72 } }
              text {
                rtf_data: "{\\rtf0\\ansi\\ansicpg1252...\\fs74\\...\\nosupersub Light guides my journey}"
              }
            }
            info: 3
          }
        }
      }
    }
  }
}
```

## Important Notes

### Adding an Additional Lyric Cue
If the new translation has more lyric sections than the original presentation, duplicate an existing complete `cues { ... }` block that has the desired bilingual layout.

1. Copy the entire cue, including its actions, slide, presentation, base slide, and both text elements.
2. Give the copied cue a new unique UUID. Do not reuse the original cue UUID.
3. Update the cue name or ordering metadata only when required by the presentation.
4. Change only the Indonesian and English lyric text after `\\nosupersub ` in the copied cue.
5. Preserve every other value exactly, especially RTF formatting, font sizes, colors, bounds, positions, dimensions, and element metadata.

Do not build a new cue from scratch when a matching cue can be duplicated. This keeps the new section consistent with the existing presentation style.

### DO's ✓
- ✓ Keep all RTF formatting codes intact
- ✓ Maintain exact spacing and indentation
- ✓ Keep font size codes (`\fs104`, `\fs74`) unchanged
- ✓ Keep Y position values for text alignment
- ✓ Always close with `}`
- ✓ Duplicate a complete cue when an additional lyric section is needed
- ✓ Assign a unique UUID to every duplicated cue
- ✓ Modify only the lyric text and necessary cue identity fields
- ✓ Test by encoding back to `.pro` format

### DON'Ts ✗
- ✗ Don't remove RTF formatting codes
- ✗ Don't change font sizes, font numbers, or other styles
- ✗ Don't alter positioning, dimensions, or bounds
- ✗ Don't change color tables
- ✗ Don't remove escape characters (`\\`)
- ✗ Don't duplicate a cue with the same UUID

## Encoding/Decoding Workflow

### Decode Binary to Text (Read for editing)
```bash
protoc --decode rv.data.Presentation ./propresenter.proto < presentation.pro > decoded.txt
```

### Make Edits
Edit the `decoded.txt` file with your bilingual lyrics

### Encode Text Back to Binary (Save changes)
```bash
protoc --encode rv.data.Presentation ./propresenter.proto < decoded.txt > presentation.pro
```

## Common Issues & Solutions

### Issue 1: Text Not Appearing
**Cause**: Missing `\nosupersub` marker
**Fix**: Ensure format is `\\nosupersub TextHere}`

### Issue 2: Font Too Large/Small
**Cause**: A style or formatting value was changed while editing the lyric text
**Fix**: Restore the original font size and all other style values. The objective is to change the lyrics, not the presentation design.

### Issue 3: Text Overlap
**Cause**: Y coordinates not properly set
**Check**: 
- First element: `y: 869.1`
- Second element: `y: 920.3`
- Don't decrease the gap below 50 points

### Issue 4: Encoding Fails
**Cause**: Malformed RTF or missing brackets
**Fix**: 
- Verify closing `}` is present
- Check backslashes are escaped (`\\` not `\`)
- Validate parentheses matching in RTF

## Quick Reference: Text Replacement Pattern

```
FIND:    rtf_data: "{\\rtf0\\ansi\\ansicpg1252{...\\nosupersub [ORIGINAL_TEXT]}"
REPLACE: rtf_data: "{\\rtf0\\ansi\\ansicpg1252{...\\nosupersub [NEW_TEXT]}"
```

## File Location Reference
- **Input file**: `decoded_lyrics_<FILE_NAME>.txt`
- **Output file**: `<FILE_NAME> TRANSLATED.pro` (after encoding)
- **Proto definition**: `propresenter.proto`
- **Working directory**: `proto/autogen-proto/`

---

## Validated Newer Context

### Locate Secondary Placeholders

Use the `rtf_data` fields as the editing boundary. The primary block is identified by `fs104`; the secondary block is identified by `fs74`. Replace only text after `\\nosupersub ` in the secondary block.

For a template containing literal placeholders, search specifically for the placeholder inside `rtf_data`:

```bash
grep -n '<TEXT>' <presentation-name>.txt
```

Do not replace a primary `fs104` lyric. Do not change RTF commands, font sizes, colors, bounds, positions, UUIDs, or element metadata.

### Verified Translation Example

For example, when a cue's primary lyric is in Indonesian, translate it to English and place the result in its paired secondary RTF block:

```text
Rise, proclaim the name of Jesus
```

The same rule applies independently to every cue: preserve the primary text and add only its matching secondary translation. When the primary lyric is English, translate it to Indonesian instead.

### Encode And Verify

Encode the edited text to a new file, then decode that output again for verification:

```bash
protoc -I ./proto/autogen-proto --encode rv.data.Presentation ./proto/autogen-proto/propresenter.proto < ./<presentation-name>.txt > "./<presentation-name> TRANSLATED.pro"
protoc -I ./proto/autogen-proto --decode rv.data.Presentation ./proto/autogen-proto/propresenter.proto < "./<presentation-name> TRANSLATED.pro" > ./verified_<presentation-name>.txt
```

Recommended checks:

```bash
grep -c 'fs74.*nosupersub ' verified_<presentation-name>.txt
grep -c 'fs74.*nosupersub}' verified_<presentation-name>.txt
grep -c '<TEXT>' verified_<presentation-name>.txt
```

The first count should equal the number of lyric cues. The second and third counts must both be zero. Also compare the original and translated `fs104` RTF lines to confirm that primary lyrics were preserved.

### Cleanup After Successful Encoding

After the encoded `.pro` file has been verified, keep the translated `.pro` file and remove temporary decoded text files when they are no longer needed:

```bash
rm ./<presentation-name>.txt ./verified_<presentation-name>.txt
```

On Windows Command Prompt, use:

```bat
del <presentation-name>.txt verified_<presentation-name>.txt
```

In the validation run, the translated output encoded to 24,463 bytes. `protoc` reported only the existing unused-import warning for `customOptions.proto`; encoding and re-decoding completed successfully.

**Last Updated**: 2026-09-03