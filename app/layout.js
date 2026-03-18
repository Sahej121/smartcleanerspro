import './globals.css';
import { LanguageProvider } from '@/lib/i18n/LanguageContext';
import { UserProvider } from '@/lib/UserContext';
import { BrandingProvider } from '@/lib/BrandingContext';
import { NotificationProvider } from '@/lib/NotificationContext';
import MainLayout from '@/components/MainLayout';

export const metadata = {
  title: 'CleanFlow – Dry Cleaner POS',
  description: 'Modern dry cleaner management and POS system',
  manifest: '/manifest.json',
  themeColor: '#10b981',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CleanFlow',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body>
        <UserProvider>
          <BrandingProvider>
            <LanguageProvider>
              <NotificationProvider>
                <MainLayout>
                  {children}
                </MainLayout>
              </NotificationProvider>
            </LanguageProvider>
          </BrandingProvider>
        </UserProvider>
      </body>
    </html>
  );
}
