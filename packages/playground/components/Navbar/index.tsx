import { Link } from "ziro/router"

export const Navbar = () => {
  return (
    <header className="flex items-center justify-between py-10">
      <div>
        <Link aria-label="TailwindBlog" to="/">
          <div className="flex items-center justify-start">
            <div className=""></div>
            <div className="hidden h-6 text-2xl font-semibold sm:block">Nariman's Blog</div>
          </div>
        </Link>
      </div>
      <div className="flex items-center space-x-4 leading-5 sm:space-x-6">
        <a className="hidden font-medium text-gray-900 dark:text-gray-100 sm:block" href="/about">
          Write
        </a>
        <button aria-label="Toggle Dark Mode">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6 text-gray-900 dark:text-gray-100">
            <path
              fillRule="evenodd"
              d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
              clipRule="evenodd"
            ></path>
          </svg>
        </button>
        <button aria-label="Toggle Menu" className="sm:hidden">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-8 w-8 text-gray-900 dark:text-gray-100">
            <path
              fillRule="evenodd"
              d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
              clipRule="evenodd"
            ></path>
          </svg>
        </button>
        <div className="fixed left-0 top-0 z-10 h-full w-full transform bg-white opacity-95 duration-300 ease-in-out dark:bg-gray-950 dark:opacity-[0.98] translate-x-full">
          <div className="flex justify-end">
            <button className="mr-8 mt-11 h-8 w-8" aria-label="Toggle Menu">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="text-gray-900 dark:text-gray-100">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                ></path>
              </svg>
            </button>
          </div>
          <nav className="fixed mt-8 h-full">
            <div className="px-12 py-4">
              <a className="text-2xl font-bold tracking-widest text-gray-900 dark:text-gray-100" href="/">
                Home
              </a>
            </div>
            <div className="px-12 py-4">
              <a className="text-2xl font-bold tracking-widest text-gray-900 dark:text-gray-100" href="/blog">
                Blog
              </a>
            </div>
            <div className="px-12 py-4">
              <a className="text-2xl font-bold tracking-widest text-gray-900 dark:text-gray-100" href="/tags">
                Tags
              </a>
            </div>
            <div className="px-12 py-4">
              <a className="text-2xl font-bold tracking-widest text-gray-900 dark:text-gray-100" href="/projects">
                Projects
              </a>
            </div>
            <div className="px-12 py-4">
              <a className="text-2xl font-bold tracking-widest text-gray-900 dark:text-gray-100" href="/about">
                About
              </a>
            </div>
          </nav>
        </div>
      </div>
    </header>
  )
}
