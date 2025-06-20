import { FastifySchema } from "fastify";
import { ROUTE } from "./controller.js";

export function Schema(schema: FastifySchema): MethodDecorator {
  return (target, propertyKey) => {
    Reflect.defineMetadata(
      `${ROUTE}:schema:${String(propertyKey)}`,
      schema,
      target
    );
  };
}
