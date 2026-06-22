# Old Content Archive

Extracted from the original Resonance Foundation website for reuse in the rebuild.

## Structure

```
oldcontent/
├── copy/           # Page text, structured data (JSON + markdown)
├── images/         # Downloaded photos (14 files) + manifest.json
└── assets/         # Local static assets from the original site
```

## Quick reference

| Item | Location |
|------|----------|
| Site metadata & taglines | `copy/site-metadata.json` |
| Navigation labels | `copy/navigation.json` |
| External links & forms | `copy/links.json` |
| Stats & pricing | `copy/stats.json`, `copy/pricing.json` |
| Programs data | `copy/programs.json` |
| FAQ (full Q&A) | `copy/faq.json` |
| Page copy (readable) | `copy/*.md` |
| Image catalog | `images/manifest.json` |

## Notes

- Photos were hosted on Vercel Blob Storage; local copies are in `images/`.
- `layout.tsx` referenced `/favicon.jpg` but only `public/icon.svg` existed in the repo.
- Some legacy components (`components/contact.tsx`, `components/get-involved.tsx`) had alternate social/form URLs — see `copy/links.json` under `legacy`.
