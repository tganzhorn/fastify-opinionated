import type { FastifyReply, FastifyRequest } from "fastify";
import { RouterCtx } from "./controller.js";

export type Ctx = ReturnType<typeof createCtx>;

export function createCtx(request: FastifyRequest, reply: FastifyReply, routerCtx: RouterCtx) {
    return {
        request, reply, routerCtx,
    };
}