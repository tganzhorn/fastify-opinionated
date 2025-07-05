import { RouteCtx } from "./controller.js";
import { Ctx } from "../ctx.js";

export function createInjectorFn(routeCtx: RouteCtx) {
  const selectors: string[] = [];

  for (const param of routeCtx.params) {
    switch (param.type) {
      case "req":
        selectors.push("ctx.request");
        break;
      case "rep":
        selectors.push("ctx.reply");
        break;
      case "query":
        selectors.push(`ctx.request.query.${param.name}`);
        break;
      case "param":
        selectors.push(`ctx.request.params.${param.name}`);
        break;
      case "body":
        selectors.push(`ctx.request.body`);
        break;
      case "headers":
        selectors.push("ctx.request.headers");
        break;
      case "raw":
        selectors.push("ctx.request.raw");
        break;
      case "context":
        selectors.push("ctx");
        break;
      case "queue":
        selectors.push(`ctx.queues.get("${param.name}")`);
        break;
      case "job":
        selectors.push(`ctx.job`);
        break;
      case "cache":
        selectors.push("ctx.cache");
        break;
      default:
        throw new Error(`No selector for "${JSON.stringify(param)}" found!`);
    }
  }

  const code = `
  return function(fn, ctx) {
    return fn(${selectors.join(",")});
  }
  `;

  return new Function(code)() as (fn: Function, ctx: Ctx) => any;
}
