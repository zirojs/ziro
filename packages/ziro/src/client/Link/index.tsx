import { AnchorHTMLAttributes, FC, MouseEventHandler, PropsWithChildren } from 'react'

export type LinkProps = { href: string }
export const Link: FC<PropsWithChildren<AnchorHTMLAttributes<{}>>> = ({ href, children, ...props }) => {
  const preventReload: MouseEventHandler = (event) => {
    event.preventDefault()
    window.history.pushState({}, '', href)
    const navigationEvent = new PopStateEvent('navigate', {
      state: href,
    })
    window.dispatchEvent(navigationEvent)
    if (props.onClick) props.onClick(event)
  }
  return (
    <a href={href} onClick={preventReload} {...props}>
      {children}
    </a>
  )
}

export default Link
