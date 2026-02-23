import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AuthProvider } from "@/context/AuthContext";
import { CategoriesProvider } from "@/contexts/CategoriesContext";
import { CMSProvider } from "@/contexts/CMSContext";
import { FirstTimeLoader } from "@/components/FirstTimeLoader";
import { AnalyticsProvider } from "@/hooks/useAnalytics";

export const metadata: Metadata = {
  title: "Wedding Bazaar - Find Perfect Wedding Providers",
  description: "Your one-stop destination for all wedding needs. Connect with the best photographers, venues, caterers, decorators, and more for your special day.",
  keywords: "wedding, providers, photography, venue, catering, wedding planner, Philippines",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col">
        <AuthProvider>
          <CategoriesProvider>
            <CMSProvider>
              <AnalyticsProvider>
                <FirstTimeLoader>
                  <Header />
                  <main className="flex-1">
                    {children}
                  </main>
                  <Footer />
                </FirstTimeLoader>
              </AnalyticsProvider>
            </CMSProvider>
          </CategoriesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
