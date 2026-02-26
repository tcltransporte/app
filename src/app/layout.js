export const metadata = {
  title: 'Sistema de Gestão de Grupos',
  description: 'Gestão de filiais e grupos de empresas',
}

export default async ({ children }) => {
  return (
    <html lang="pt-br">
      <body style={{ margin: 0, fontFamily: 'sans-serif', backgroundColor: '#fafafa' }}>
        {children}
      </body>
    </html>
  )
}