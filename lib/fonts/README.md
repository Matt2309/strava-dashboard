# Self-hosted fonts

Font binaries vendored in-repo to eliminate any browser request to Google
domains (`fonts.googleapis.com` / `fonts.gstatic.com`) — see
`docs/gdpr-compliance-audit.md` §5. Both licensed under SIL OFL 1.1
(`OFL-*.txt`), which permits redistribution.

| File | Source | Version |
|------|--------|---------|
| `InterVariable.woff2` | https://github.com/rsms/inter/raw/master/docs/font-files/InterVariable.woff2 | 4.66 (roman) |
| `InterVariable-Italic.woff2` | https://github.com/rsms/inter/raw/master/docs/font-files/InterVariable-Italic.woff2 | 4.66 (italic) |
| `GeistMono[wght].woff2` | https://github.com/vercel/geist-font/raw/main/packages/next/dist/fonts/geist-mono/GeistMono-Variable.woff2 | latest on `main` as of 2026-08-05 |

Declared via `next/font/local` in `fonts.ts` — Next.js self-hosts these at
build time (no further network access needed at runtime or build time to
any Google service).

To update: re-download from the sources above and overwrite the matching
file; no code changes needed unless the axis/weight range changes.
