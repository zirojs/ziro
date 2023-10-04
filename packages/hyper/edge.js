// node_modules/ufo/dist/index.mjs
var r = String.fromCharCode;
var TRAILING_SLASH_RE = /\/$|\/\?/;
function hasTrailingSlash(input = "", queryParameters = false) {
  if (!queryParameters) {
    return input.endsWith("/");
  }
  return TRAILING_SLASH_RE.test(input);
}
function withTrailingSlash(input = "", queryParameters = false) {
  if (!queryParameters) {
    return input.endsWith("/") ? input : input + "/";
  }
  if (hasTrailingSlash(input, true)) {
    return input || "/";
  }
  const [s0, ...s] = input.split("?");
  return s0 + "/" + (s.length > 0 ? `?${s.join("?")}` : "");
}
function isNonEmptyURL(url) {
  return url && url !== "/";
}
var JOIN_LEADING_SLASH_RE = /^\.?\//;
function joinURL(base, ...input) {
  let url = base || "";
  for (const segment of input.filter((url2) => isNonEmptyURL(url2))) {
    if (url) {
      const _segment = segment.replace(JOIN_LEADING_SLASH_RE, "");
      url = withTrailingSlash(url) + _segment;
    } else {
      url = segment;
    }
  }
  return url;
}

// src/server/lib/readJsonFile.ts
import { readFileSync } from "fs";
var readJsonFile = (filepath) => JSON.parse(readFileSync(new URL(filepath, import.meta.url), { encoding: "utf-8" }));

// src/cli/edge.ts
var routes = readJsonFile(joinURL(process.cwd(), "server-bundles", "manifest.json"));
var workerBase = `import { toWebHandler } from 'h3'
import { joinURL } from 'ufo'
import { bootstrapEdgeHyperApp } from '../server/edge'


<--import-manifest-->
<--import-page-modules-->

const webHandler = toWebHandler(bootstrapEdgeHyperApp(routes))

export default {
  async fetch(request: any, env: any, ctx: any) {
    const thisUrl = new URL(request.url)
    const pathName = thisUrl.pathname
    if (pathName.startsWith('/_hyper/')) {
      thisUrl.pathname = pathName.replace('/_hyper', './client-bundles')
      const newRequest = new Request(thisUrl.toString(), new Request(request, {}))
      return env.ASSETS.fetch(newRequest)
    }
    return webHandler(request, {
      cloudflare: { env, ctx },
    })
  },
}`;
var importManifest = `const routes: Record<string, { file: string; module: any }> = await import('${joinURL(process.cwd(), "server-bundles", "manifest.json")}')`;
var importPageModules = ``;
Object.keys(routes).forEach((key) => {
  importPageModules += `routes["${key}"].module = import(${joinURL(process.cwd(), "server-bundles", routes[key].file)})
`;
});
workerBase = workerBase.replace("<--import-manifest-->", importManifest);
workerBase = workerBase.replace("<--import-page-modules-->", importPageModules);
console.log(workerBase);
