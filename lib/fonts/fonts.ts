import localFont from "next/font/local";

/**
 * Self-hosted fonts — see README.md.
 *
 * Both are bundled locally to avoid any browser request to Google-owned
 * font CDNs (fonts.googleapis.com / fonts.gstatic.com), per
 * docs/gdpr-compliance-audit.md §5.
 */

export const inter = localFont({
	src: [
		{ path: "./InterVariable.woff2", weight: "100 900", style: "normal" },
		{
			path: "./InterVariable-Italic.woff2",
			weight: "100 900",
			style: "italic",
		},
	],
	variable: "--font-inter",
	display: "swap",
});

export const geistMono = localFont({
	src: "./GeistMono[wght].woff2",
	weight: "100 900",
	variable: "--font-geist-mono",
	display: "swap",
});
