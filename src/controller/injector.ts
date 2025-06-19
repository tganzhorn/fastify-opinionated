import { RouterCtx } from "./controller.js";
import { Ctx } from "./ctx.js";

export function createInjectorFn(routerCtx: RouterCtx) {
  const selectors: string[] = [];

  for (const param of routerCtx.params) {
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
    }
  }

  const code = `
  return function(fn, ctx) {
    return fn(${selectors.join(",")});
  }
  `;

  return new Function(code)() as (fn: Function, ctx: Ctx) => any;
}
