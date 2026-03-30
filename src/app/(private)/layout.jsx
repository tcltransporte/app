import MainLayout from '@/components/layout/MainLayout';
import { getSession } from '@/libs/session';
import { findAll as findSolicitationTypes } from '@/app/services/solicitationType.service';
import { findAll as findDocumentTypes } from '@/app/services/documentType.service';
import { parseSitemap } from '@/libs/sitemapParser';
import { SessionContextProvider } from '@/context/SessionContext';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export default async function PublicLayout({ children }) {

  let session = null;
  let currentPath = '/';

  try {

    const headersList = await headers();
    currentPath = headersList.get('x-invoke-path') || '/';
    session = await getSession();

  } catch (error) {

    if (currentPath === '/') {
      redirect('/sign-in');
    } else {
      redirect(`/sign-in?redirect=${encodeURIComponent(currentPath)}`);
    }
  }

  const [typesResp, docTypesResp] = await Promise.all([
    findSolicitationTypes(null, { limit: 100 }),
    findDocumentTypes(null)
  ]);

  const solicitationTypes = typesResp.body.items || [];
  const documentTypes = docTypesResp.body.items || [];
  const sitemapMenuItems = await parseSitemap();

  return (
    <SessionContextProvider initialSession={session}>
      <MainLayout 
        solicitationTypes={solicitationTypes} 
        documentTypes={documentTypes}
        sitemapMenuItems={sitemapMenuItems}
      >
        {children}
      </MainLayout>
    </SessionContextProvider>
  );
}
