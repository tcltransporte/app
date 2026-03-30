import { Inter } from 'next/font/google';
import { cookies, headers } from 'next/headers';
import { ThemeContextProvider } from '@/context/ThemeContext';
import { LoadingProvider } from '@/context/LoadingContext';
import { Suspense } from 'react';
import RouteProgressBar from '@/components/RouteProgressBar';
import '@/styles/swal-custom.css';

const inter = Inter({ subsets: ['latin'] });

import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';

export const metadata = {
  title: process.env.NEXT_PUBLIC_APP_TITLE || 'Sistema de Gestão de Grupos',
  description: 'Gestão de filiais e grupos de empresas',
}

export default async function RootLayout({ children }) {

  const cookieStore = await cookies();
  const headerList = await headers();
  const userAgent = headerList.get('user-agent') || '';

  // Basic server-side mobile detection
  const isMobile = /mobile|android|iphone|ipad|phone/i.test(userAgent);

  const themeConfig = {
    mode: cookieStore.get('theme-mode')?.value || 'light',
    primaryColor: cookieStore.get('theme-primaryColor')?.value || '#6366f1',
    menu: cookieStore.get('theme-menu')?.value || 'recolhido',
    semiDark: cookieStore.get('theme-semiDark')?.value === 'true',
  };

  return (
    <html lang="pt-br">
      <body
        className={inter.className}
        style={{
          margin: 0,
          backgroundColor: '#fafafa',
          '--route-progress-color': themeConfig.primaryColor
        }}
        suppressHydrationWarning
      >
        <AppRouterCacheProvider>
          <Suspense>
            <RouteProgressBar />
          </Suspense>
          <ThemeContextProvider initialConfig={themeConfig} initialMobile={isMobile}>
            <LoadingProvider>
              {children}
            </LoadingProvider>
          </ThemeContextProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  )
}
