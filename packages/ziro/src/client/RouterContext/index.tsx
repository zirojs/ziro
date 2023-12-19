import { FC, PropsWithChildren, useEffect, useState } from 'react'

export const RouterContext: FC<PropsWithChildren> = ({ children }) => {
  const [routeContent, setRouteContent] = useState(children)
  const onRouteChange = () => {
    const href = window.location.pathname
    import(/* @vite-ignore */ `/_hyper.js?pageOnly&page=${href}`).then((m) => {
      setRouteContent(m.page())
      // ;(window as any).root.render(<RouterContext>{m.page()}</RouterContext>)
    })
  }
  useEffect(() => {
    window.addEventListener('navigate', onRouteChange)
    window.addEventListener('popstate', onRouteChange)
    return () => {
      window.removeEventListener('navigate', onRouteChange)
      window.removeEventListener('popstate', onRouteChange)
    }
  }, [])
  return <>{routeContent}</>
}

export default RouterContext
