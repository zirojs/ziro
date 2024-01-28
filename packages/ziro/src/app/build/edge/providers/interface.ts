export interface EdgeProvider {
  generate(): Promise<void>
}
