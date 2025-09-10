import "./globals.css";

export const metadata = {
  title: "Neurality Health - Dental Scout",
  description: "Dental Scout is a tool that helps you find emails of dental practice owners.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
