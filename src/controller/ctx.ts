import type { FastifyReply, FastifyRequest } from "fastify";
import { RouteCtx } from "./controller.js";

export type Ctx = ReturnType<typeof createCtx>;

export function createCtx(request: FastifyRequest, reply: FastifyReply, routerCtx: RouteCtx) {
    return {
        request, reply, routerCtx,
    };
}