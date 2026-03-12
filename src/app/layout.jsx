import { Inter } from 'next/font/google';
import { cookies, headers } from 'next/headers';
import MainLayout from '../components/layout/MainLayout';
import { ThemeContextProvider } from '@/context/ThemeContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Sistema de Gestão de Grupos',
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
    menu: cookieStore.get('theme-menu')?.value || 'vertical',
    semiDark: cookieStore.get('theme-semiDark')?.value === 'true',
  };

  return (
    <html lang="pt-br">
      <body className={inter.className} style={{ margin: 0, backgroundColor: '#fafafa' }}>
        <ThemeContextProvider initialConfig={themeConfig} initialMobile={isMobile}>
          {children}
        </ThemeContextProvider>
      </body>
    </html>
  )
}