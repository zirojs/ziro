import {
	App,
	createApp,
	eventHandler,
	getRequestURL,
	getValidatedQuery,
} from "h3";
import { createRouter } from "radix3";
import { joinURL } from "ufo";
import { RouteData } from "../../lib/RouterObj";
import { PageAttrs, attachPageAttrs } from "../../lib/htmlInjector";
import { parseBody } from "../../lib/parseBody";
import { loadPageModules, pageSSRRenderer } from "./pageRenderer";
import { pathGenerator } from "./pathGenerator";

const template = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <!--ziro-meta-->
    <!--ziro-links-->
  </head>
  <body>
    <div id="ziro-app"><!--ssr-outlet--></div>
    <!--ziro-scripts-->
  </body>
</html>
`;

export const setupFsRoutes = (app: App, routes: any) => {
	const router = createRouter<RouteData>();

	const data = routes;
	const pages: Record<string, string[]> = {};

	for (const file of Object.keys(data))
		if (file.startsWith("pages/")) {
			const dir = file.replace("pages/", "").split("/").slice(0, -1).join("/");
			if (!pages[dir]) pages[dir] = [];
			pages[dir].push(file.split("/").pop()!);
		}

	const paths = pathGenerator(pages);

	Object.keys(paths).forEach((route) => {
		// @ts-ignore
		router.insert("/" + route, {
			filePath: data[`pages/${paths[route]}`].file,
			manifestData: data[`pages/${paths[route]}`],
		});
	});

	// configure middleware to handle routes matches with file system
	app.use(
		eventHandler(async (event) => {
			const pathname = getRequestURL(event).pathname;
			const routeData = router.lookup(pathname);

			if (routeData) {
				let render, htmlContent;

				const pageAttrs: PageAttrs = { scripts: [], links: [], meta: {} };

				htmlContent = template;

				render = await pageSSRRenderer(routeData, pageAttrs);

				const appHtml = await render();
				let html = htmlContent.replace(`<!--ssr-outlet-->`, appHtml);

				pageAttrs.scripts.push({
					type: "module",
					src: joinURL(`/_ziro`, routeData.filePath.replace(".server", "")),
				});
				if (routeData.manifestData?.css) {
					routeData.manifestData?.css.forEach((href) => {
						pageAttrs.links.push({
							href: joinURL(`/_ziro`, href),
							rel: "stylesheet",
							type: "text/css",
						});
					});
				}

				html = attachPageAttrs(html, pageAttrs);
				return html;
			}
		}),
	);

	app.use(
		"/api",
		eventHandler(async (event) => {
			const { page } = await getValidatedQuery<{ page: string }>(
				event,
				(data) => {
					const page = (data as { page: string }).page;

					return new Promise((resolve, reject) => {
						if (page && router.lookup(page)) resolve({ page });
						else {
							reject("page path is not valid!");
						}
					});
				},
			);

			const pageInfo = router.lookup(page);
			if (pageInfo) {
				const [_clientModule, serverModule] = await loadPageModules(pageInfo!);

				if (event.method === "POST") {
					const action = serverModule.action;
					if (action) {
						try {
							return await action(await parseBody(event), event);
						} catch (err) {
							return;
						}
					}
				} else if (event.method === "GET") {
					const loader = serverModule.loader;

					return loader(event);
				}
			}
			return {};
		}),
	);
};

export const bootstrapEdgeZiroApp = (routes: any) => {
	const app = createApp();

	setupFsRoutes(app, routes);

	return app;
};
