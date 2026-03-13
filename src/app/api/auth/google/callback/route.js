import { NextResponse } from 'next/server';
import { getOAuth2Client } from '@/libs/google-sheets';
import { getSession } from '@/libs/session';
import { AppContext } from '@/database';
import * as userRepository from '@/app/repositories/user.repository';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 });
  }

  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    // Save tokens to user
    const db = new AppContext();
    await db.transaction(async (transaction) => {
      await db.User.update(
        {
          googleAccessToken: tokens.access_token,
          googleRefreshToken: tokens.refresh_token,
          googleTokenExpiry: tokens.expiry_date,
        },
        { 
          where: { id: session.user.id },
          transaction 
        }
      );
    });

    // Close the popup and notify the parent window
    return new Response(
      `<html>
        <body>
          <script>
            window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS' }, '*');
            window.close();
          </script>
          <p>Autenticação concluída com sucesso! Você pode fechar esta janela.</p>
        </body>
      </html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );
  } catch (error) {
    console.error('Error in Google OAuth callback:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
