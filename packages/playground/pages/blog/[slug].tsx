import { DefaultLayout } from '../../components/layouts'
import '../style.css'

export default function Page (){
  return (
    <DefaultLayout>
      <main className="mb-auto">
        <section className="mx-auto max-w-3xl px-4 sm:px-6 xl:max-w-5xl xl:px-0">
          <article>
            <div className="xl:divide-y xl:divide-gray-200 xl:dark:divide-gray-700">
              <header className="pt-6 xl:pb-6">
                <div className="space-y-1 text-center">
                  <dl className="space-y-10">
                    <div>
                      <dt className="sr-only">Published on</dt>
                      <dd className="text-base font-medium leading-6 text-gray-500 dark:text-gray-400">
                        <time dateTime="2023-08-05T00:00:00.000Z">Saturday, August 5, 2023</time>
                      </dd>
                    </div>
                  </dl>
                  <div>
                    <h1 className="text-3xl font-extrabold leading-9 tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl sm:leading-10 md:text-5xl md:leading-14">
                      Release of Tailwind Nextjs Starter Blog v2.0
                    </h1>
                  </div>
                </div>
              </header>
              <div className="grid-rows-[auto_1fr] divide-y divide-gray-200 pb-8 dark:divide-gray-700 xl:grid xl:grid-cols-4 xl:gap-x-6 xl:divide-y-0">
                <div className="divide-y divide-gray-200 dark:divide-gray-700 xl:col-span-3 xl:row-span-2 xl:pb-0">
                  <div className="prose max-w-none pb-8 pt-10 dark:prose-invert">
                    <h2 id="introduction">
                      <a href="#introduction" aria-hidden="true" tabIndex={-1}>
                        <span className="icon icon-link"></span>
                      </a>
                      Introduction
                    </h2>
                    <p>
                      Welcome to the release of Tailwind Nextjs Starter Blog template v2.0. This release is a major refactor of the codebase to support Nextjs App directory and React Server
                      Components. Read on to discover the new features and how to migrate from V1.
                    </p>
                    <h2 id="v1-to-v2">
                      <a href="#v1-to-v2" aria-hidden="true" tabIndex={-1}>
                        <span className="icon icon-link"></span>
                      </a>
                      V1 to V2
                    </h2>
                    <p>
                      The template was first released in January 2021 and has since been used by thousands of users. It is featured on{' '}
                      <a target="_blank" rel="noopener noreferrer" href="https://vercel.com/templates/next.js/tailwind-css-starter-blog">
                        Next.js Templates
                      </a>
                      ,{' '}
                      <a target="_blank" rel="noopener noreferrer" href="https://www.tailwindawesome.com/resources/tailwind-nextjs-starter-blog">
                        Tailwind Awesome
                      </a>{' '}
                      among other listing sites. It attracts 200+ unique visitors daily notching 1500-2000 page views, with 1.3k forks and many other clones.
                    </p>
                    <p>
                      Many thanks to the community of users and contributors for making this template a success! I created a small video montage of the blogs (while cleaning up the list in the readme)
                      to showcase the diversity of the blogs created using the template and to celebrate the milestone:
                    </p>
                    <p>
                      Version 2 builds on the success of the previous version and introduces many new features and improvements. The codebase has been refactored to support Next.js App directory and
                      React Server Components. Markdown / MDX is now processed using Contentlayer, a type-safe content SDK that validates and transforms your content into type-safe JSON data. It
                      integrates with Pliny, a new library that provides out of the box Next.js components to enhance your static site with analytics, comments and newsletter subscription. A new
                      command palette (⌘-k) search component is also added to the template.
                    </p>
                    <p>Let's dive into the new features and improvements in V2.</p>
                    <h2 id="conclusion">
                      <a href="#conclusion" aria-hidden="true" tabIndex={-1}>
                        <span className="icon icon-link"></span>
                      </a>
                      Conclusion
                    </h2>
                    <p>
                      I hope you enjoy the new features and improvements in V2. If you have any feedback or suggestions, feel free to open an issue or reach out to me on{' '}
                      <a target="_blank" rel="noopener noreferrer" href="https://twitter.com/timlrx">
                        Twitter
                      </a>
                      .
                    </p>
                    <h2 id="support">
                      <a href="#support" aria-hidden="true" tabIndex={-1}>
                        <span className="icon icon-link"></span>
                      </a>
                      Support
                    </h2>
                    <p>
                      Using the template? Support this effort by giving a star on GitHub, sharing your own blog and giving a shoutout on Twitter or be a project{' '}
                      <a target="_blank" rel="noopener noreferrer" href="https://github.com/sponsors/timlrx">
                        sponsor
                      </a>
                      .
                    </p>
                    <h2 id="licence">
                      <a href="#licence" aria-hidden="true" tabIndex={-1}>
                        <span className="icon icon-link"></span>
                      </a>
                      Licence
                    </h2>
                    <p>
                      <a target="_blank" rel="noopener noreferrer" href="https://github.com/timlrx/tailwind-nextjs-starter-blog/blob/main/LICENSE">
                        MIT
                      </a>{' '}
                      ©{' '}
                      <a target="_blank" rel="noopener noreferrer" href="https://www.timrlx.com">
                        Timothy Lin
                      </a>
                    </p>
                  </div>
                </div>
                <footer>
                  <div className="divide-gray-200 text-sm font-medium leading-5 dark:divide-gray-700 xl:col-start-1 xl:row-start-2 xl:divide-y">
                    <div className="py-4 xl:py-8">
                      <h2 className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Tags</h2>
                      <div className="flex flex-wrap">
                        <a className="mr-3 text-sm font-medium uppercase text-primary-500 hover:text-primary-600 dark:hover:text-primary-400" href="/tags/next-js">
                          next-js
                        </a>
                        <a className="mr-3 text-sm font-medium uppercase text-primary-500 hover:text-primary-600 dark:hover:text-primary-400" href="/tags/tailwind">
                          tailwind
                        </a>
                        <a className="mr-3 text-sm font-medium uppercase text-primary-500 hover:text-primary-600 dark:hover:text-primary-400" href="/tags/guide">
                          guide
                        </a>
                        <a className="mr-3 text-sm font-medium uppercase text-primary-500 hover:text-primary-600 dark:hover:text-primary-400" href="/tags/feature">
                          feature
                        </a>
                      </div>
                    </div>
                    <div className="flex justify-between py-4 xl:block xl:space-y-8 xl:py-8">
                      <div>
                        <h2 className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Previous Article</h2>
                        <div className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400">
                          <a href="/blog/new-features-in-v1">New features in v1</a>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 xl:pt-8">
                    <a className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400" aria-label="Back to the blog" href="/blog">
                      ← Back to the blog
                    </a>
                  </div>
                </footer>
              </div>
            </div>
          </article>
        </section>
      </main>
    </DefaultLayout>
  )
}
