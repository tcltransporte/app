import MainLayout from '@/components/layout/MainLayout';
import { getSession } from '@/libs/session';
import { findAll as findSolicitationTypes } from '@/app/services/solicitationType.service';
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

  const typesResp = await findSolicitationTypes({ limit: 100 });
  const solicitationTypes = typesResp.items || [];

  return (
    <SessionContextProvider initialSession={session}>
      <MainLayout solicitationTypes={solicitationTypes}>{children}</MainLayout>
    </SessionContextProvider>
  );
}
