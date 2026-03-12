import MainLayout from '@/components/layout/MainLayout';
import { getSession } from '@/libs/session';
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
    if (error.message === 'NEXT_REDIRECT') {
      throw error;
    }

    if (currentPath === '/') {
      redirect('/login');
    } else {
      redirect(`/login?redirect=${encodeURIComponent(currentPath)}`);
    }
  }

  return (
    <SessionContextProvider initialSession={session}>
      <MainLayout>{children}</MainLayout>
    </SessionContextProvider>
  );
}
