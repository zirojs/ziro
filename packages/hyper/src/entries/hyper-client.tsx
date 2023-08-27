import ReactDOM from 'react-dom/client'
;(async () => ReactDOM.hydrateRoot(document.getElementById('hyper-app') as HTMLElement, await import(/* @vite-ignore */ (window as any)._pagePath).then((m) => m.page())))()
