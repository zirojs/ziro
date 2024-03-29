import { createRouter } from "h3";
import { joinURL } from "ufo";
import { ZiroApp } from "..";
import { bootstrapH3Server } from "../server";
import {
	ZiroConfig,
	ZiroRoute,
	ZiroRouteClientBundle,
	ZiroRouteServerBundle,
} from "../ziro-types";
import { pathGenerator } from "./edge/pathGenerator";

type ManifestFile = {
	css?: string[];
	file: string;
	imports?: string[];
};

const getImportersCss = (
	importer: ManifestFile,
	css: Set<string>,
	manifestData: Record<string, ManifestFile>,
) => {
	if (importer.css) {
		importer.css.forEach((c) => {
			css.add(c);
		});
	}
	if (importer.imports) {
		for (let i = 0; i < importer.imports.length; i++) {
			if (!!manifestData[importer.imports[i]])
				getImportersCss(manifestData[importer.imports[i]], css, manifestData);
		}
	}
};

const normalizeManifestData = (
	manifest: ManifestFile,
	allManifest: Record<string, ManifestFile>,
) => {
	const css = new Set<string>();
	getImportersCss(manifest, css, allManifest);
	manifest.css = [];
	for (const c of css) {
		manifest.css.push(joinURL("/_ziro", c));
	}
	return manifest;
};

export const ziroEdgeRunner = async (
	config: ZiroConfig,
	manifest: Record<
		string,
		{
			file: string;
			module: any;
			isEntry: boolean;
			clientBundle: ZiroRouteClientBundle;
			serverBundle: ZiroRouteServerBundle;
		}
	>,
) => {
	const app = new ZiroApp([], {
		isEdge: true,
	});

	app.routeParser = async (route: ZiroRoute) => {
		if (route.filePath) {
			const routeManifestKey: any = Object.keys(manifest).find(
				(key) => key.endsWith(route.filePath!) && !key.startsWith("pages/"),
			);
			const routeManifest = manifest[routeManifestKey];

			// @ts-ignore
			route.manifestData = normalizeManifestData(routeManifest, manifest);
			route.filePath = routeManifest.file;
		}
		return route;
	};

	await app.installPlugins(config!.plugins || []);

	const pages: Record<string, string[]> = {};

	for (const file of Object.keys(manifest))
		if (file.startsWith("pages/")) {
			const dir = file
				.replace(/(.*)pages\//i, "")
				.split("/")
				.slice(0, -1)
				.join("/");
			if (!pages[dir]) pages[dir] = [];
			pages[dir].push(file.split("/").pop()!);
		}

	const paths = pathGenerator(pages);

	Object.keys(paths).forEach((route) => {
		app.routes.insert("/" + route, {
			URL: "/" + route,
			filePath: manifest[`pages/${paths[route]}`].file,
			// @ts-ignore
			manifestData: normalizeManifestData(
				manifest[`pages/${paths[route]}`],
				manifest,
			),
			clientBundle: manifest[`pages/${paths[route]}`].clientBundle,
			serverBundle: manifest[`pages/${paths[route]}`].serverBundle,
		});
	});

	// return file system file
	const router = createRouter();

	// router.add(
	//   '/_ziro/**',
	//   eventHandler(async (event) => {
	//     const filePath = event.path.replace('/_ziro', '')
	//     const extension = filePath.split('.')[filePath.split('.').length - 1]

	//     const contentTypes = {
	//       css: 'text/css',
	//       js: 'text/javascript',
	//       mjs: 'text/javascript',
	//     }

	//     setHeaders(event, {
	//       'Content-Type': contentTypes[extension as keyof typeof contentTypes],
	//     })
	//     return readFileSync(joinURL(process.cwd(), '.ziro', 'client-bundles', filePath))
	//   })
	// )

	app.h3.use(router);

	app.transformHTML = async (template, event) => {
		return template;
	};

	bootstrapH3Server(app);

	return app.h3;
};
