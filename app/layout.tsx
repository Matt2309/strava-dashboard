import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ErrorBoundary from "@/components/ErrorBoundary";
import { TanstackProvider } from "@/components/providers/tanstack-wrapper";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Toaster } from "@/components/ui/sonner";
import {GoogleTagManager} from "@next/third-parties/google";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Dromos",
	description: "Boost your training",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
        <head>
            <script
                // biome-ignore lint/security/noDangerouslySetInnerHtml: Necesary for GTM
                dangerouslySetInnerHTML={{
                    __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              
              // default on deny
              gtag('consent', 'default', {
                'ad_storage': 'denied',
                'ad_user_data': 'denied',
                'ad_personalization': 'denied',
                'analytics_storage': 'denied',
                'personalization_storage': 'denied',
                'functionality_storage': 'granted', // Necessari per il sito
                'security_storage': 'granted',      // Necessari per Cloudflare
                'wait_for_update': 500             // Dà tempo a Cookiebot di caricarsi
              });
              
              // Nascondi i dati degli annunci finché non c'è consenso
              gtag('set', 'ads_data_redaction', true);
            `,
                }}
            />
        </head>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem
					disableTransitionOnChange
				>
					<ErrorBoundary>
						<div className="flex fixed top-4 right-4 z-50">
							<ThemeToggle />
						</div>
						<TanstackProvider>{children}</TanstackProvider>
						<Toaster />
					</ErrorBoundary>
				</ThemeProvider>
			</body>
            <GoogleTagManager gtmId="GTM-KJXQXRXK" />
		</html>
	);
}
