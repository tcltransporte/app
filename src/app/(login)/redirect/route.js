import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function GET(request) {

  const { searchParams } = new URL(request.url)

  const token = searchParams.get('token')
  const url = searchParams.get('url') || '/'

  if (!token) {
    const loginUrl = url !== '/' ? `/sign-in?redirect=${encodeURIComponent(url)}` : '/sign-in'
    redirect(loginUrl)
  }

  const cookieStore = await cookies()
  cookieStore.set('authorization', token, { path: '/', maxAge: 60 * 60 * 8 })

  redirect(url)

}
