import { joinURL } from 'ufo'
import { Cloudflare } from './providers/cloudflare'
import { EdgeProvider } from './providers/interface'

export type ProvidersType = 'cloudflare'

export const edgeProviders: ProvidersType[] = ['cloudflare']

const providerMapper: Record<ProvidersType, new (...args: any[]) => EdgeProvider> = {
  cloudflare: Cloudflare,
}

export const generateEdgeBundle = async (provider: ProvidersType) => {
  const serverBundlesDir = joinURL(process.cwd(), '.hyper', 'server-bundles')
  await new providerMapper[provider](serverBundlesDir).generate()
}
