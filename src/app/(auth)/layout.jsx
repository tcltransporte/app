import { getSession } from '@/libs/session';
import { redirect } from 'next/navigation';

export default async function AuthLayout({ children }) {
  try {
    const session = await getSession();

    // If the getSession doesn't throw, it means we have a valid session token.
    if (session?.id) {
      redirect('/');
    }
  } catch (error) {
    // If it's a NEXT_REDIRECT, rethrow it so Next.js can handle it
    if (error.message === 'NEXT_REDIRECT') {
      throw error;
    }
    
    // If it throws any other error (invalid token, missing cookie), 
    // it means the user is not authenticated, which is exactly what we want for auth pages.
    // We just catch and proceed rendering the children (the login page).
  }

  return children;
}
