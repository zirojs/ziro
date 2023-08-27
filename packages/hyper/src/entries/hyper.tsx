export const generateClientBundle = (path: string) => {
  return `
	import ReactDOM from 'react-dom/client'
	;(async () => ReactDOM.hydrateRoot(document.getElementById('hyper-app') as HTMLElement, await import(${path}).then((m) => m.page())))()`
}
