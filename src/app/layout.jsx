import MainLayout from '../components/layout/MainLayout';

export const metadata = {
  title: 'Sistema de Gestão de Grupos',
  description: 'Gestão de filiais e grupos de empresas',
}

export default async function RootLayout({ children }) {
  return (
    <html lang="pt-br">
      <body style={{ margin: 0, fontFamily: 'sans-serif', backgroundColor: '#fafafa' }}>
        <MainLayout>
          {children}
        </MainLayout>
      </body>
    </html>
  )
}