import { FastifySchema } from "fastify";
import { ROUTE } from "./controller.js";

/**
 * @function Schema
 * @param {FastifySchema} schema - The Fastify validation schema to apply to a route handler method.
 * @returns {MethodDecorator} A method decorator that attaches the given schema as metadata to the route method.
 *
 * @description
 * Decorator to associate a Fastify validation schema with a specific route handler method.
 * This metadata can be used later to validate request data or generate API documentation.
 */
export function Schema(schema: FastifySchema): MethodDecorator {
  return (target, propertyKey) => {
    Reflect.defineMetadata(
      `${ROUTE}:schema:${String(propertyKey)}`,
      schema,
      target
    );
  };
}
