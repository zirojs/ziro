import { FC, PropsWithChildren } from 'react'
import { Footer } from '../Footer'
import { Navbar } from '../Navbar'

export const DefaultLayout: FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className="bg-white text-black antialiased dark:bg-gray-950 dark:text-white ">
      <section className="mx-auto max-w-3xl px-4 sm:px-6 xl:max-w-5xl xl:px-0">
        <div className="flex flex-col justify-between font-sans">
          <Navbar />
          {children}
          <Footer />
        </div>
      </section>
    </div>
  )
}
