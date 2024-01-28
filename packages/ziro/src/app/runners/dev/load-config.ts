import { existsSync } from "node:fs";
import { joinURL } from "ufo";
import { ziroDefaultConfig } from "../..";
import { ZiroConfig } from "../../ziro-types";
import { getVite } from "./vite";

let config: Required<ZiroConfig> | null = null;

export const getConfig = async () => {
	if (config === null) await reloadConfig();
	return config as Required<ZiroConfig>;
};

export const ziroConfigPath = joinURL(process.cwd(), "ziro.config.js");

export const reloadConfig = async () => {
	if (existsSync(ziroConfigPath)) {
		const vite = await getVite();
		config = (await vite.ssrLoadModule(ziroConfigPath))
			.default as Required<ZiroConfig>;
	} else config = ziroDefaultConfig;
};
