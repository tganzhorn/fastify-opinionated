import { Ctx } from "./ctx";
import { DEPS_CTX_SYMBOL } from "./depsCtx";

export function buildControllers<
  ControllerType extends new (...args: any[]) => any
>(controllers: ControllerType[]): InstanceType<ControllerType>[] {
  const controllerInstances: InstanceType<ControllerType>[] = [];

  for (const Controller of controllers) {
    const controllerInstance = instantiateWithDeps(Controller);
    controllerInstances.push(controllerInstance);
  }

  return controllerInstances;
}

export function instantiateWithDeps<T>(
  target: new (...args: any[]) => T,
  ctx?: Ctx
): T {
  const { deps } = Reflect.getMetadata(DEPS_CTX_SYMBOL, target) || [];
  const dependencies = deps.map((dep: any) => instantiateWithDeps(dep, ctx));
  const instance = new target(...dependencies);
  if ("onServiceInit" in (instance as object))
    (instance as any).onServiceInit();

  return instance;
}
