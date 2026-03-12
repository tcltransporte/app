import MainLayout from '@/components/layout/MainLayout';
import { getSession } from '@/libs/session';
import { SessionContextProvider } from '@/context/SessionContext';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export default async function PublicLayout({ children }) {

  console.log('public layout')

  let session = null;
  let currentPath = '/';

  try {

    const headersList = await headers();
    currentPath = headersList.get('x-invoke-path') || '/';
    session = await getSession();

    console.log('session', session)

    if (!session?.id) {
      if (currentPath === '/') {
        redirect('/login');
      } else {
        redirect(`/login?redirect=${encodeURIComponent(currentPath)}`);
      }
    }

  } catch (error) {
    if (error.message === 'NEXT_REDIRECT') {
      throw error;
    }

    console.log(error);
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
