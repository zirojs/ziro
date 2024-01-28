import { joinURL } from 'ufo'
import { Cloudflare } from './providers/cloudflare'
import { EdgeProvider } from './providers/interface'
import { ProvidersType } from './types'

const providerMapper: Record<ProvidersType, new (...args: any[]) => EdgeProvider> = {
  cloudflare: Cloudflare,
}

export const generateEdgeBundle = async (provider: ProvidersType) => {
  const serverBundlesDir = joinURL(process.cwd(), '.ziro', 'server-bundles')
  await new providerMapper[provider](serverBundlesDir).generate()
}
