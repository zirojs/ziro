import chalk from "chalk";
import { toNodeListener } from "h3";
import { Listener, listen } from "listhen";
import { isDevelopment } from "std-env";
import { ZiroApp } from "../..";
import { bootstrapH3Server } from "../../server";

let currentWebServer: Listener | null = null;

export const serveLocal = async (app: ZiroApp) => {
	await bootstrapH3Server(app);
	currentWebServer = await listen(toNodeListener(app.h3), {
		port: 3000,
		showURL: false,
		hostname: "0.0.0.0",
	});
	console.log(
		`${chalk.yellowBright.bold("Ziro ۰")} ${chalk.green.dim(
			isDevelopment ? "[Development]" : "[Production]",
		)}`,
	);
	console.log(`Local: ${chalk.green(currentWebServer.url)}`);

	return currentWebServer;
};

export const getCurrentWebServer = () => {
	return currentWebServer as Listener;
};
