import * as jose from 'jose'
import { HyperApp } from 'xhyper'
import { H3Event, getCookie, getHeader, setCookie, setResponseStatus } from 'xhyper/h3.js'

export const DEFAULT_AUTH_COOKIE_NAME = 'HYPER_AUTH_TOKEN'

export type HyperAuthUser = any
export type HyperAuthOptions = {
  authenticate: (username: string, password: string) => Promise<HyperAuthUser>
  secredKey: string
  cookieName?: string
}

export default ({ authenticate, secredKey, cookieName = DEFAULT_AUTH_COOKIE_NAME }: HyperAuthOptions) => {
  const secret = jose.base64url.decode(secredKey)
  return {
    name: 'xhyper-plugin-auth',
    install: (app: HyperApp) => {
      app.addPage({
        URL: '/auth',
        clientBundle: async () => ({
          page: () => {
            return 'hi this is awesome'
          },
        }),
        serverBundle: async () => ({
          action: async ({ username, password }: any, event: H3Event) => {
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
          },
          loader: async (event: H3Event) => {
            const headerAuth = getHeader(event, 'authorization')
            let token
            if (headerAuth) {
              token = headerAuth.replace('Bearer ', '')
            } else token = getCookie(event, cookieName)

            if (!token) {
              setResponseStatus(event, 401)
              return { authenticated: false }
            }
            const { payload: user } = await jose.jwtDecrypt(token, secret, {
              issuer: 'urn:example:issuer',
              audience: 'urn:example:audience',
            })
            return { authenticated: true, user }
          },
        }),
        isFileBased: false,
      })
    },
  }
}
