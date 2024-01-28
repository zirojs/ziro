import * as jose from 'jose'
import type React from 'react'
import { getCookie, getHeader, setCookie, setResponseStatus, type H3Event } from 'ziro'
import { DEFAULT_AUTH_COOKIE_NAME, type ZiroAuthOptions } from '../../index.ts'

export const meta = () => {
  return {
    title: 'Login',
  }
}

export const action = async ({ username, password }: any, event: H3Event, { authenticate, secredKey, cookieName = DEFAULT_AUTH_COOKIE_NAME }: ZiroAuthOptions) => {
  const secret = jose.base64url.decode(secredKey)

  try {
    const user = await authenticate(username, password)
    if (!user) throw new Error('User not found')
    const token = await new jose.EncryptJWT(user)
      .setProtectedHeader({ alg: 'dir', enc: 'A128CBC-HS256' })
      .setIssuedAt()
      .setIssuer('urn:example:issuer')
      .setAudience('urn:example:audience')
      .encrypt(secret)
    setCookie(event, cookieName, token)
    return { authorized: true, token }
  } catch (e) {
    console.error(e)
    return { error: true, message: 'invalid credentials' }
  }
}

export const loader = async (event: H3Event, { secredKey, cookieName = DEFAULT_AUTH_COOKIE_NAME }: ZiroAuthOptions) => {
  const secret = jose.base64url.decode(secredKey)
  const headerAuth = getHeader(event, 'authorization')
  let token
  if (headerAuth) {
    token = headerAuth.replace('Bearer ', '')
  } else token = getCookie(event, cookieName)

  if (!token) {
    setResponseStatus(event, 401)
    return { authenticated: false }
  }
  try {
    const { payload: user } = await jose.jwtDecrypt(token, secret, {
      issuer: 'urn:example:issuer',
      audience: 'urn:example:audience',
    })
    return { authenticated: true, user }
  } catch (e) {
    setResponseStatus(event, 401)
    return { error: 'unauthorized' }
  }
}

export default function AuthPage() {
  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault()
    alert('not implemented')
  }
  return (
    <div className="w-full flex justify-center">
      <form className="flex flex-col gap-2 max-w-[250px] w-full mt-8" onSubmit={handleSubmit}>
        <span className="font-bold text-center w-full text-lg">Login</span>
        <span className="text-gray-400 text-xs w-full text-center -mt-2 pb-2">Ziro Auth</span>
        <input className="border border-gray-400 px-3 py-2 rounded-md text-md" name="username" placeholder="email@example.com" />
        <input className="border border-gray-400 px-3 py-2 rounded-md text-md" name="password" placeholder="••••••••" type="password" />
        <button className="bg-gray-800 text-white py-2 rounded-md" type="submit">
          Login
        </button>
      </form>
    </div>
  )
}
