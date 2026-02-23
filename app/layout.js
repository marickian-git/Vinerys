import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from '@/components/Navbar';
import Providers from './providers';

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "VINERYS - Management Colecție Vinuri",
  description: "Aplicație pentru gestionarea colecției personale de vinuri",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ro">
      <body className={inter.className}>
        <Providers>
          <Navbar />
          <main className="pt-16 min-h-screen bg-gray-50">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}