import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hiroki Takaya | Private Jiu-Jitsu Lessons in Vancouver",
  description:
    "Book private Brazilian Jiu-Jitsu lessons with Hiroki Takaya, IBJJF Asian Championship Bronze Medalist. 1-on-1 sessions in Metro Vancouver.",
  openGraph: {
    title: "Hiroki Takaya | Private Jiu-Jitsu Lessons",
    description:
      "IBJJF Asian Championship Bronze Medalist. Personalized BJJ training in Metro Vancouver.",
    images: ["/images/hiroki-portrait.jpg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
