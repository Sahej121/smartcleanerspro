import './globals.css';
import { LanguageProvider } from '@/lib/i18n/LanguageContext';
import { UserProvider } from '@/lib/UserContext';
import { BrandingProvider } from '@/lib/BrandingContext';
import { NotificationProvider } from '@/lib/NotificationContext';
import MainLayout from '@/components/MainLayout';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: {
    default: 'DrycleanersFlow – The Premium Dry Cleaning POS & Management Platform',
    template: '%s | DrycleanersFlow'
  },
  description: 'Elevate your dry cleaning business with DrycleanersFlow. A modern, all-in-one POS and management system designed for premium ateliers, laundry networks, and garment care specialists.',
  keywords: ['dry cleaner pos', 'laundry management software', 'dry cleaning software', 'garment care pos', 'laundry business automation'],
  authors: [{ name: 'DrycleanersFlow Team' }],
  creator: 'DrycleanersFlow',
  publisher: 'DrycleanersFlow',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'DrycleanersFlow – Modern Dry Cleaning POS',
    description: 'The definitive management platform for modern garment care businesses.',
    url: 'https://smartcleaners.pro',
    siteName: 'DrycleanersFlow',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'DrycleanersFlow Dashboard Preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DrycleanersFlow – Modern Dry Cleaning POS',
    description: 'Elevate your garment care business with the ultimate management platform.',
    images: ['/og-image.png'],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'DrycleanersFlow',
  },
};

export const viewport = {
  themeColor: '#10b981',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({ children }) {
  // Fetch session on the server to avoid client-side loading states
  const session = await getSession();
  
  // Transform session to user object for UserProvider
  const initialUser = session ? {
    id: session.id,
    name: session.name,
    email: session.email,
    role: session.role === 'manager' ? 'admin' : session.role,
    store_id: session.store_id,
    tier: session.tier,
    suspended: session.suspended,
    auth_id: session.auth_id || null,
  } : null;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="icon" href="/icons/logo-icon.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Outfit:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body>
        <UserProvider initialUser={initialUser}>
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
