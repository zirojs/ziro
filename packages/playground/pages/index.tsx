import { ZiroPage, useAction, usePageLoader } from 'ziro/page'
import { ArticlePreview } from '../components/Article/preview'
import { DefaultLayout } from '../components/layouts'
import { posts as PostModal, db } from '../drizzle'
import './style.css'

export const loader = async () => {
  const posts = await db.select().from(PostModal)
  return { message: 'hello world', posts }
}

export const action = async (fields: any) => {
  try {
    await db.insert(PostModal).values({
      title: fields.title,
      content: fields.title,
    })
  } catch (err) {
    console.log(err)
  }
  return { ok: true }
}

export const meta = ({ loaderData }: { loaderData: Awaited<ReturnType<typeof loader>> }) => {
  return {
    title: `${loaderData.posts.length} Posts | Home | Hyper playground`,
    description: 'a new ssr website',
    keywords: 'something fun',
  }
}

export const Page: ZiroPage = ({ loaderData }) => {
  const { refetch } = usePageLoader()
  const { submit, loading } = useAction({
    onSuccess: (data) => {
      refetch()
    },
  })

  return (
    <DefaultLayout>
      <main className="mb-auto">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          <div className="space-y-2 pb-8 pt-6 md:space-y-5">
            <h1 className="text-3xl font-extrabold leading-9 tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14">Latest</h1>
            <p className="text-lg leading-7 text-gray-500 dark:text-gray-400">A blog created with Ziro and Tailwind.css</p>
          </div>
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {[...Array(2).keys()].map((i) => {
              return (
                <li className="py-12" key={i}>
                  <ArticlePreview />
                </li>
              )
            })}
          </ul>
        </div>
      </main>
    </DefaultLayout>
  )
}
