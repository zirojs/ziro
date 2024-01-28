import { Link } from "ziro/router";

export const loader = (...args: any) => {
	// console.log(args);
	return { ok: true };
};

export const meta = ({
	loaderData,
}: { loaderData: Awaited<ReturnType<typeof loader>> }) => {

	return {
		title: `status`,
		description: "a new ssr website",
		keywords: "something fun",
	};
};

export default function PageContent() {
	// const data = useLoaderData({
	// 	from: "/",
	// });
	// console.log(data);
	return (
		<div className="flex flex-col gap-4 p-6">
			<Link to="/blog" className="px-4 py-1 border-blue-400 rounded-md border">
				link to blog
			</Link>
			<Link
				to="/blog/hi"
				className="px-4 py-1 border-blue-400 rounded-md border"
			>
				link to blog post
			</Link>
		</div>
	);
}
