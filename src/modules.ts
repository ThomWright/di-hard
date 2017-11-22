import Visibility from "./visibility"
import Lifetime from "./lifetimes"

export type Id = string
export type ModulePath = Id[]

export type Factory = (resolver: any) => Instance
export type Instance = any

export interface ComponentRegistration {
  readonly modulePath: ModulePath
  readonly visibility: Visibility
}
export interface InstanceRegistration extends ComponentRegistration {
  readonly instance: Instance
}
export interface FactoryRegistration extends ComponentRegistration {
  readonly factory: Factory
  readonly lifetime: Lifetime
}
export interface ModuleRegistration extends ComponentRegistration {
  readonly module: Module
}
export interface Module {
  readonly instances: Record<Id, InstanceRegistration | undefined>
  readonly factories: Record<Id, FactoryRegistration | undefined>
  readonly modules: Record<Id, ModuleRegistration | undefined>
}

export interface ModuleRegistrationApi {
  registerFactory(
    id: Id,
    visibility: Visibility,
    lifetime: Lifetime,
    factory: Factory,
  ): void
  registerInstance(id: Id, visibility: Visibility, instance: Instance): void
  registerModule(id: Id, visibility: Visibility): void
  forSubModule(id: Id): ModuleRegistrationApi
}

const ROOT_MODULE_PATH: ModulePath = []

export {
  createRootModuleRegistration,
  createRegistrationApi,
  cacheInstance,
  getSubModule,
  getRegistration,
  exists,
  formatModulePath,
  parseModulePath,
  splitModulePath,
  getParentPath,
  joinModulePath,
  isPathEqual,
  getAllResolvableIds,
}

function createRootModuleRegistration(): ModuleRegistration {
  return {
    modulePath: ROOT_MODULE_PATH,
    visibility: Visibility.Public,
    module: createModule(),
  }
}

function createModule(): Module {
  return {
    instances: {},
    factories: {},
    modules: {},
  }
}

function getSubModule(
  currentModuleReg: ModuleRegistration,
  modulePath: ModulePath,
): ModuleRegistration | undefined {
  if (modulePath.length === 0) {
    return currentModuleReg
  }

  let targetModuleReg: ModuleRegistration | undefined = currentModuleReg
  modulePath.forEach(modId => {
    if (!targetModuleReg) {
      return
    }
    const next = targetModuleReg.module.modules[modId]
    if (next) {
      targetModuleReg = next
    } else {
      targetModuleReg = undefined
    }
  })

  return targetModuleReg
}

function getRegistration(
  currentModuleReg: ModuleRegistration,
  modulePath: ModulePath,
): ComponentRegistration | undefined {
  if (modulePath.length === 0) {
    return currentModuleReg
  }
  const {parentModulePath, componentId} = splitModulePath(modulePath)
  let parentModuleReg: ModuleRegistration | undefined = currentModuleReg
  parentModulePath.forEach(modId => {
    if (!parentModuleReg) {
      return
    }
    if (!parentModuleReg.module) {
      parentModuleReg = undefined
      return
    }
    const next = parentModuleReg.module.modules[modId]
    if (next) {
      parentModuleReg = next
    } else {
      parentModuleReg = undefined
    }
  })
  if (!parentModuleReg) {
    return parentModuleReg
  }
  const m = parentModuleReg.module.modules[componentId]
  if (m) {
    return m
  }
  const f = parentModuleReg.module.factories[componentId]
  if (f) {
    return f
  }
  const i = parentModuleReg.module.instances[componentId]
  if (i) {
    return i
  }
  return undefined
}

function exists(mod: Module, id: Id): boolean {
  return !!(mod.factories[id] || mod.instances[id] || mod.modules[id])
}

function createRegistrationApi(
  rootModule: ModuleRegistration,
): ModuleRegistrationApi {
  function forContext(moduleContext: ModulePath): ModuleRegistrationApi {
    const currentModule = getSubModule(rootModule, moduleContext)
    if (!currentModule) {
      throw new Error(
        `Could not create module registration API for '${moduleContext}'`,
      )
    }
    return {
      registerFactory: registerFactoryIn(currentModule),
      registerInstance: registerInstanceIn(currentModule),
      registerModule: registerModuleIn(currentModule),
      forSubModule: (id: Id) => forContext(joinModulePath(moduleContext, id)),
    }
  }
  return forContext(ROOT_MODULE_PATH)
}

function registerFactoryIn(currentModuleReg: ModuleRegistration) {
  return (
    id: Id,
    visibility: Visibility,
    lifetime: Lifetime,
    factory: Factory,
  ) => {
    checkAvailability(currentModuleReg.module, id)

    currentModuleReg.module.factories[id] = {
      modulePath: joinModulePath(currentModuleReg.modulePath, id),
      visibility,
      lifetime,
      factory,
    }
  }
}

function registerInstanceIn(currentModuleReg: ModuleRegistration) {
  return (id: Id, visibility: Visibility, instance: Instance) => {
    checkAvailability(currentModuleReg.module, id)

    currentModuleReg.module.instances[id] = {
      modulePath: joinModulePath(currentModuleReg.modulePath, id),
      visibility,
      instance,
    }
  }
}

function registerModuleIn(currentModuleReg: ModuleRegistration) {
  return (id: Id, visibility: Visibility) => {
    checkAvailability(currentModuleReg.module, id)

    currentModuleReg.module.modules[id] = {
      modulePath: joinModulePath(currentModuleReg.modulePath, id),
      visibility,
      module: createModule(),
    }
  }
}

function checkAvailability(mod: Module, id: Id): void {
  if (mod.factories.hasOwnProperty(id)) {
    throw new Error(`Cannot register '${id}' - already registered as a factory`)
  }
  if (mod.instances.hasOwnProperty(id)) {
    throw new Error(`Cannot register '${id}' - already registered as a value`)
  }
  if (mod.modules.hasOwnProperty(id)) {
    throw new Error(
      `Cannot register '${id}' - already registered as a submodule`,
    )
  }
  if (typeof id !== "string") {
    throw new Error(`Cannot register '${id}' - ID must be a string`)
  }
  if (!/^[a-z](?:[_-]?[a-z0-9]+)*$/i.test(id)) {
    throw new Error(
      `Cannot register '${id}' - invalid ID. Allowed characters: 'a-z', 'A-Z', '0-9', '-' and '_'. Must begin with a letter, and end with a letter or number`,
    )
  }
}

function cacheInstance(
  modReg: ModuleRegistration,
  id: Id,
  visibility: Visibility,
  instance: Instance,
) {
  modReg.module.instances[id] = {
    modulePath: joinModulePath(modReg.modulePath, id),
    visibility,
    instance,
  }
}

function formatModulePath(modPath: ModulePath): string {
  return modPath.join(".")
}

function parseModulePath(formattedModulePath: string): ModulePath {
  return formattedModulePath.split(".")
}

function joinModulePath(
  modulePath: ModulePath,
  rest: Id | ModulePath,
): ModulePath {
  if (Array.isArray(rest)) {
    return [...modulePath, ...rest]
  }
  return [...modulePath, rest]
}

function splitModulePath(fullComponentPath: ModulePath) {
  const parentModulePath = getParentPath(fullComponentPath)
  const componentId = fullComponentPath[fullComponentPath.length - 1]
  return {parentModulePath, componentId}
}

function getParentPath(fullComponentPath: ModulePath): ModulePath {
  return fullComponentPath.slice(0, -1)
}

function isPathEqual(
  modulePath1: ModulePath,
  modulePath2: ModulePath,
): boolean {
  return formatModulePath(modulePath1) === formatModulePath(modulePath2)
}

function getAllResolvableIds(mod: Module): Set<Id> {
  const s = new Set<Id>()

  Object.getOwnPropertyNames(mod.factories).forEach(id => s.add(id))
  Object.getOwnPropertyNames(mod.instances).forEach(id => s.add(id))
  Object.getOwnPropertyNames(mod.modules).forEach(id => s.add(id))

  return s
}
