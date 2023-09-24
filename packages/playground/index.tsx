import { FC, PropsWithChildren } from 'react'
import './style.css'

export const layout: FC<PropsWithChildren> = ({ children }) => {
  return (
    <div>
      main layout
      {children}
    </div>
  )
}
