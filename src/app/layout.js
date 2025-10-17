import "./globals.css";
import BlackholeCursor from "@/components/BlackholeCursor";

export const metadata = {
  title: "Neurality Health - Dental Scout",
  description: "Dental Scout is a tool that helps you find emails of dental practice owners.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased" suppressHydrationWarning={true}>
        <BlackholeCursor />
        {children}
      </body>
    </html>
  );
}
