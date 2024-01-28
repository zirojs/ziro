import React from "react";
import { ZiroMeta } from "../ziro-types";

export type PageAttrs = {
	scripts: Record<string, any>[];
	links: Record<string, any>[];
	meta: Record<string, string>;
};
export const attachPageAttrs = (pageAttrs: PageAttrs) => {
	return {
		links: [
			React.createElement(
				React.Fragment,
				{},
				pageAttrs.links.map((link, id) => {
					return React.createElement("link", { key: id, ...link });
				}),
			),
		],
		scripts: [
			React.createElement(
				React.Fragment,
				{},
				pageAttrs.scripts.map((script, id) => {
					return React.createElement("script", { key: id, ...script });
				}),
			),
		],
		meta: [
			React.createElement(
				React.Fragment,
				{},
				Object.keys(pageAttrs.meta).map((name) => {
					if (name === "title")
						return React.createElement(
							"title",
							{ key: name },
							pageAttrs.meta[name],
						);
					return React.createElement("meta", {
						key: name,
						content: pageAttrs.meta[name],
					});
				}),
			),
		],
	};
};

export const generateMetaSSR = (data: Awaited<ReturnType<ZiroMeta>>) => {
	return React.createElement(
		React.Fragment,
		{},
		Object.keys(data).map((key) => {
			return React.createElement(
				key === "title" ? "title" : "meta",
				{
					content: key === "title" ? null : data[key],
					key,
				},
				key === "title" ? data.title : null,
			);
		}),
	);
};
