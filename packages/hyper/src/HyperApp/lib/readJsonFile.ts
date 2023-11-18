import { readFileSync } from 'fs'
export const readJsonFile = (filepath: string) => JSON.parse(readFileSync(new URL(filepath, import.meta.url), { encoding: 'utf-8' }))
