import Link from 'hyper/link'

export const page = () => {
  return (
    <>
      <div className="block">products page here</div>
      <Link className="bg-red-500" href="/">
        Back to homepage
      </Link>
    </>
  )
}
