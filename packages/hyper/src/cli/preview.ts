import { runServer } from './dev'

export const bootstrapHyperPreviewApp = async () => {
  const { app } = await runServer()

  return { app }
}
