#!/usr/bin/env node
import { Command, Option } from "commander";
import { default as pkg } from "../package.json" assert { type: "json" };
import { edgeProviders } from "../src/app/build/edge/types";

const program = new Command();
const { name, version } = pkg;
program.name(name).description("React SSR Framework").version(version);

program
	.command("dev")
	.description("run ziro dev server")
	.action(async (str, options) => {
		process.env.NODE_ENV = "development";
		(await import("../src/app/runners/dev")).ziroDevServer();
	});
program
	.command("build")
	.description("build ziro project")
	.addOption(
		new Option("--edge <provider>", "build for edge").choices(edgeProviders),
	)
	.action(async (options) => {
		process.env.NODE_ENV = "production";
		(await import("../src/app/build")).ziroBuild();
		if (options.edge) {
			(await import("../src/app/build/edge")).generateEdgeBundle(options.edge);
		}
	});

program
	.command("preview")
	.description("preview ziro project")
	.action(async (str, options) => {
		process.env.NODE_ENV = "production";
		(await import("../src/app/runners/production")).ziroProductionServer();
	});

program.parse(process.argv);
