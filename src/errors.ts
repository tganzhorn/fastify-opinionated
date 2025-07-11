import fastify, { FastifyReply } from "fastify";
import { Type } from "@sinclair/typebox";

type ErrorStatis =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "METHOD_NOT_ALLOWED"
  | "INTERNAL_ERROR";

const errorMap: Record<ErrorStatis, number> = {
  BAD_REQUEST: 400,
  FORBIDDEN: 403,
  UNAUTHORIZED: 401,
  INTERNAL_ERROR: 500,
  METHOD_NOT_ALLOWED: 405,
  NOT_FOUND: 404,
};

const fastifyModularErrorSymbol = Symbol.for("FastifyModularError");

export class FastifyModularError<T> extends Error {
  readonly [fastifyModularErrorSymbol] = true;
  readonly code: number;
  readonly payload?: T;
  readonly status: ErrorStatis;

  constructor(status: ErrorStatis, message: string, payload?: T) {
    super(message);
    this.status = status;
    this.code = errorMap[status];
    this.payload = payload;
  }

  static fromError<T>(
    error: Error,
    status: ErrorStatis,
    message: string,
    payload?: T
  ) {
    const fastifyError = new FastifyModularError(status, message, payload);

    fastifyError.stack = error.stack;
    fastifyError.cause = error.cause;

    return fastifyError;
  }

  toJSON() {
    return {
      status: this.status,
      message: this.message,
      payload: this.payload,
      internal: {
        stack: this.stack,
        cause: this.cause,
      },
    };
  }

  send(reply: FastifyReply) {
    return reply.status(this.code).send(this.toJSON());
  }
}

export function isFastifyModularError<T>(
  error: unknown
): error is FastifyModularError<T> {
  return (error as FastifyModularError<T>)[fastifyModularErrorSymbol] === true;
}

function createErrorResponseOpenAPI(description: string) {
  return Type.Object(
    {
      status: Type.String(),
      message: Type.String(),
      payload: Type.Any(),
      internal: Type.Object({
        stack: Type.Optional(Type.String()),
        cause: Type.Optional(Type.String()),
      }),
    },
    { description }
  );
}

export const fastifyErrorResponses = {
  400: createErrorResponseOpenAPI("Bad request, input malformed."),
  401: createErrorResponseOpenAPI("Unauthorized"),
  403: createErrorResponseOpenAPI("Forbidden"),
  405: createErrorResponseOpenAPI("Method not allowed"),
  500: createErrorResponseOpenAPI("Internal server error"),
};

export function handleFastifyError(e: unknown, reply: FastifyReply) {
  if (isFastifyModularError(e)) {
    e.send(reply);
    return;
  }
  if (e instanceof Error) {
    FastifyModularError.fromError(e, "INTERNAL_ERROR", e.message).send(reply);
    return;
  }
  new FastifyModularError("INTERNAL_ERROR", "Unknown internal error!").send(
    reply
  );
}
