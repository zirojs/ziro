export const ArticlePreview = () => {
  return (
    <article>
      <div className="space-y-2 xl:grid xl:grid-cols-4 xl:items-baseline xl:space-y-0">
        <dl>
          <dt className="sr-only">Published on</dt>
          <dd className="text-base font-medium leading-6 text-gray-500 dark:text-gray-400">
            <time dateTime="2023-08-05T00:00:00.000Z">August 5, 2023</time>
          </dd>
        </dl>
        <div className="space-y-5 xl:col-span-3">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold leading-8 tracking-tight">
                <a className="text-gray-900 dark:text-gray-100" href="/blog/release-of-tailwind-nextjs-starter-blog-v2.0">
                  Release of Tailwind Nextjs Starter Blog v2.0
                </a>
              </h2>
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
            <div className="prose max-w-none text-gray-500 dark:text-gray-400">
              Release of Tailwind Nextjs Starter Blog template v2.0, refactored with Nextjs App directory and React Server Components setup.Discover the new features and how to migrate from V1.
            </div>
          </div>
          <div className="text-base font-medium leading-6">
            <a
              className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
              aria-label='Read more: "Release of Tailwind Nextjs Starter Blog v2.0"'
              href="/blog/release-of-tailwind-nextjs-starter-blog-v2.0"
            >
              Read more →
            </a>
          </div>
        </div>
      </div>
    </article>
  )
}
