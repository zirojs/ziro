import Link from 'hyper/link'

export const loader = (ctx: any) => {
  return { message: 'hello world' }
}

export const action = (req: any, res: any, ctx: any) => {}

export const loading = () => {}

export const error = () => {}

export const page = () => {
  // const { action } = useAction()
  return (
    <div>
      <form
        className="flex flex-col max-w-[300px] gap-2 p-8"
        // onSubmit={action}
      >
        <label htmlFor="name">Your name</label>
        <input className="border border-gray-300 py-2 px-6 rounded-md" name="name" id="name" />
        <button type="submit" className="text-white bg-blue-500 rounded-md block py-2 px-6">
          Submit
        </button>
        <Link href="/products" className="hover:underline text-blue-500 capitalize block text-center mt-12">
          go to products
        </Link>
      </form>
    </div>
  )
}
