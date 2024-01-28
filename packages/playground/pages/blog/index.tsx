import { Link } from 'ziro/router'
export default function Blog() {
  return (
    <div>
      <Link to="/blog/hi" className="px-4 py-1 border-blue-400 rounded-md border">
        home
      </Link>
    </div>
  )
}
