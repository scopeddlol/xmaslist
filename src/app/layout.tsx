import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Christmas List",
    description: "A sleek, self-hosted Christmas wishlist. Share one link, everyone knows what to buy.",
};

export const viewport: Viewport = {
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#ffffff" },
        { media: "(prefers-color-scheme: dark)", color: "#08090c" },
    ],
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
};

/** Applies the stored theme before paint so there is no light/dark flash. */
const THEME_SCRIPT = `try{var t=localStorage.getItem("xmas-theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark-mode")}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
                    rel="stylesheet"
                />
                <link
                    rel="icon"
                    href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ctext y='26' font-size='26'%3E%F0%9F%8E%81%3C/text%3E%3C/svg%3E"
                />
                <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
            </head>
            <body className="min-h-dvh antialiased">
                <div className="aurora" aria-hidden />
                <div className="relative z-10">{children}</div>
            </body>
        </html>
    );
}
