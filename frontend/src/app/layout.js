import { Outfit, DM_Serif_Display } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const dmSerifDisplay = DM_Serif_Display({
  variable: "--font-dm-serif",
  weight: ["400"],
  subsets: ["latin"],
});

import { AuthProvider } from "../context/AuthContext";

export const metadata = {
  title: "Farm Vision",
  description: "Advanced Agentic Coding Farm Vision Platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${outfit.variable} ${dmSerifDisplay.variable}`}>
      <body className="font-sans bg-gray-50 text-gray-900 antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
