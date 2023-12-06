import Link from '@hyper-insights/hyper/link'
import { HyperPage, useAction, usePageLoader } from '@hyper-insights/hyper/page'
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

export const page: HyperPage = ({ loaderData }) => {
  const { refetch } = usePageLoader()

  const { submit, loading } = useAction({
    onSuccess: (data) => {
      refetch()
    },
  })

  return (
    <div>
      <span>Loader Data: {JSON.stringify(loaderData)}</span>
      <form className="flex flex-col max-w-[300px] gap-2 p-8" onSubmit={submit}>
        <div className="flex flex-col gap-2">
          <label htmlFor="name">Post title</label>
          <input name="title" className="border border-gray-300 py-2 px-3 rounded-md" id="name" />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="name">Content</label>
          <textarea name="content" className="border border-gray-300 py-2 px-3 rounded-md" id="content	" />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="name">Picture</label>
          <input type="file" name="picture" />
        </div>
        <button type="submit" className="text-white bg-blue-500 rounded-md block py-2 px-3">
          {loading ? 'Loading...' : 'Add post'}
        </button>
        <Link href="/products" className="hover:underline text-blue-500 capitalize block text-center mt-12">
          go to products
        </Link>
      </form>
    </div>
  )
}
