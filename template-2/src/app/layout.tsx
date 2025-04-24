import "./globals.css";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import Navigation from "../components/Navigation";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "GT Staff Hub",
  description: "Manage and assign tasks to teachers and groups",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <Navigation />
            <main className="flex-grow p-4 md:p-8">{children}</main>
            <footer className="border-t p-4 text-center text-sm text-gray-500">
              © {new Date().getFullYear()} GT Staff Hub
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
