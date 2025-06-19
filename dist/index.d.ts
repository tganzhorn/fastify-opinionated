import { RouteShorthandOptions, FastifyInstance } from 'fastify';

declare function Body(): ParameterDecorator;
declare function Query(name: string): ParameterDecorator;
declare function Parameter(name: string): ParameterDecorator;
declare function Req(): ParameterDecorator;
declare function Rep(): ParameterDecorator;

type Path = `/${string}`;
/**
 *
 * @param rootPath Root path e.g. /events but can be anything that starts with /.
 * @param deps Dependencies to inject e.g. Services. Important you have to order your dependencies like you order them in the constructor.
 * @returns
 */
declare function Controller(rootPath: Path, deps: NewableFunction[]): ClassDecorator;
declare function Get(path: Path, opts?: RouteShorthandOptions): (target: object, propertyKey: string, descriptor: TypedPropertyDescriptor<(...params: any[]) => any>) => void;
declare function Post(path: Path, opts?: RouteShorthandOptions): (target: object, propertyKey: string, descriptor: TypedPropertyDescriptor<(...params: any[]) => any>) => void;
declare function Put(path: Path, opts?: RouteShorthandOptions): (target: object, propertyKey: string, descriptor: TypedPropertyDescriptor<(...params: any[]) => any>) => void;
declare function Delete(path: Path, opts?: RouteShorthandOptions): (target: object, propertyKey: string, descriptor: TypedPropertyDescriptor<(...params: any[]) => any>) => void;
declare function Patch(path: Path, opts?: RouteShorthandOptions): (target: object, propertyKey: string, descriptor: TypedPropertyDescriptor<(...params: any[]) => any>) => void;

declare const INJECTABLE_SERVICE_SYMBOL: unique symbol;
declare function Service(deps: NewableFunction[]): ClassDecorator;

declare function registerControllers<ControllerType extends new (...args: any[]) => any>(fastify: FastifyInstance, { controllers, }: {
    controllers: ControllerType[];
}): void;

export { Body, Controller, Delete, Get, INJECTABLE_SERVICE_SYMBOL, Parameter, Patch, Post, Put, Query, Rep, Req, Service, registerControllers };
