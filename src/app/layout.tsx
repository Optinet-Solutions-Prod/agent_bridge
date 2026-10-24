import type { Metadata, Viewport } from "next";
import { Geist_Mono, Hanken_Grotesk, Young_Serif } from "next/font/google";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import "./globals.css";

// Body/UI face: a warm grotesk with enough character not to read as a default.
const hanken = Hanken_Grotesk({ variable: "--font-hanken", subsets: ["latin"], display: "swap" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
// Display face: warm, low-contrast, sunlit — carries the landing page's voice.
const youngSerif = Young_Serif({ variable: "--font-young-serif", subsets: ["latin"], weight: "400", display: "swap" });

export const metadata: Metadata = {
  title: { default: APP_NAME, template: `%s · ${APP_NAME}` },
  description: `${APP_TAGLINE} Browse homes across Portugal shared by the agents who hold them; agencies pool stock, match buyers and lock co-broker terms before anyone is revealed.`,
};

// Phone baseline: paint under the notch, let the keyboard resize the layout,
// and colour the status bar like the page's top edge.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: "#f8f7f3",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${hanken.variable} ${geistMono.variable} ${youngSerif.variable} h-full`}>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
