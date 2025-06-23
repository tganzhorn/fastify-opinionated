import { Ctx } from "./controller/ctx";
import { DEPS_CTX_SYMBOL } from "./depsCtx";
import { Scope, SCOPE_SYMBOL } from "./scopeCtx";

export function buildControllers<
  ControllerType extends new (...args: any[]) => any
>(
  controllers: ControllerType[]
): [InstanceType<ControllerType>, ControllerType, boolean][] {
  const controllerInstances: [
    InstanceType<ControllerType>,
    ControllerType,
    boolean
  ][] = [];

  for (const Controller of controllers) {
    const [controllerInstance, isRequestScoped] =
      instantiateWithDeps(Controller);
    console.log(isRequestScoped);
    controllerInstances.push([controllerInstance, Controller, isRequestScoped]);
  }

  return controllerInstances;
}

export function instantiateWithDeps<T>(
  target: new (...args: any[]) => T,
  ctx?: Ctx,
  isRequestScoped = false
): [T, boolean] {
  const scope =
    (Reflect.getMetadata(SCOPE_SYMBOL, target) as Scope) ?? "SINGLETON";

  isRequestScoped ||= scope === "REQUEST";

  const { deps } = Reflect.getMetadata(DEPS_CTX_SYMBOL, target) || [];
  const dependencies = deps.map((dep: any) => {
    const [instance, isRequestScopedCalled] = instantiateWithDeps(
      dep,
      ctx,
      isRequestScoped
    );

    isRequestScoped ||= isRequestScopedCalled;

    return instance;
  });
  const instance = new target(...dependencies, ctx);
  if ("onServiceInit" in (instance as object))
    (instance as any).onServiceInit();

  return [instance, isRequestScoped];
}
