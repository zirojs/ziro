import { DehydrateRouter, Outlet } from 'ziro/router'
import './style.css'

export default function Root() {
  return (
    <>
      {/* <Suspense fallback="loading..."> */}
      <div className="root">
        <Outlet />
      </div>
      {/* </Suspense> */}
      <DehydrateRouter />
    </>
  )
}

const defaultRoot = () => {
  return (
    <>
      <Outlet />
      <DehydrateRouter />
    </>
  )
}
