import createResolver, {LocationInfo} from "./resolver"
import {
  Id,
  Factory,
  Instance,
  ModuleRegistrationApi,
  createRootModuleRegistration,
  getSubModule,
  parseModulePath,
  splitModulePath,
  createRegistrationApi as createModuleRegistrationApi,
} from "./modules"
import Visibility from "./visibility"
import Lifetime from "./lifetimes"
import getDebugInfo, {DebugInfo} from "./debug-info"

export interface FactoryOptions {
  visibility?: Visibility
  lifetime?: Lifetime
}
export interface InstanceOptions {
  visibility?: Visibility
}
export interface ModuleOptions {
  visibility?: Visibility
}
export interface ContainerRegistrationApi {
  registerFactory(
    id: Id,
    factory: Factory,
    options?: FactoryOptions,
  ): ContainerRegistrationApi
  registerValue(
    id: Id,
    instance: Instance,
    options?: InstanceOptions,
  ): ContainerRegistrationApi
  registerSubmodule(id: Id, options?: ModuleOptions): ContainerRegistrationApi
}

export interface ContainerExternalApi {
  resolve(id: Id): Instance
  child(name: string): Container
  getDebugInfo(): DebugInfo
}

export interface ContainerInternalApi {
  resolve(
    id: Id,
    previousDependencyPath?: LocationInfo[],
    previouslySearchedContainers?: string[],
    previouslyResolvableIds?: Set<Id>,
  ): Instance
  getDebugInfo(): DebugInfo
  visiblePathToContainer(targetContainer: string): string[] | undefined
}

export type Container = ContainerRegistrationApi & ContainerExternalApi

export default function() {
  return {
    createContainer(containerName: string): Container {
      if (!containerName) {
        throw new Error("Must provide container name")
      }
      return _createContainer({
        containerName,
        parentContainerInternal: undefined,
      })
    },
  }
}

function _createContainer({
  containerName,
  parentContainerInternal,
}: {
  containerName: string
  parentContainerInternal?: ContainerInternalApi
}): Container {
  const rootModuleReg = createRootModuleRegistration()

  const internal: ContainerInternalApi = {
    resolve(
      formattedModulePath: string,
      previousDependencyPath: LocationInfo[] = [],
      previouslySearchedContainers: string[] = [],
      previouslyResolvableIds: Set<Id> = new Set<Id>(),
    ): Instance {
      const fullComponentPath = parseModulePath(formattedModulePath)
      const {parentModulePath, componentId} = splitModulePath(fullComponentPath)
      const mod = getSubModule(rootModuleReg, parentModulePath)
      if (!mod) {
        throw new Error(
          `Could not resolve '${formattedModulePath}' - parent module does not exist`,
        )
      }
      return createResolver({
        containerName,
        forComponent: rootModuleReg,
        parentContainer: parentContainerInternal,
        rootModuleReg,
        fromModuleReg: mod,
        previousDependencyPath,
        previouslySearchedContainers,
        previouslyResolvableIds,
      })[componentId]
    },

    getDebugInfo(): DebugInfo {
      return getDebugInfo({
        containerName,
        parentContainer: parentContainerInternal,
        rootModuleReg,
      })
    },

    // return the path from this container to targetContainer, or undefined if targetContainer is not visible
    visiblePathToContainer(targetContainer: string): string[] | undefined {
      if (targetContainer === containerName) {
        return [containerName]
      }
      if (!parentContainerInternal) {
        return undefined
      }
      const parentContainers = parentContainerInternal.visiblePathToContainer(
        targetContainer,
      )
      if (parentContainers) {
        return [containerName, ...parentContainers]
      }
      return undefined
    },
  }

  function createRegistrationApi(
    moduleRegistration: ModuleRegistrationApi,
  ): ContainerRegistrationApi {
    const registrationApi: ContainerRegistrationApi = {
      // TODO make lifetime/visibility an options object
      registerFactory(
        id: Id,
        factory: Factory,
        {
          lifetime = Lifetime.Transient,
          visibility = Visibility.Private,
        }: FactoryOptions = {},
      ): ContainerRegistrationApi {
        if (typeof factory !== "function") {
          throw new Error(
            `Can't register '${id}' as a factory - it is not a function`,
          )
        }

        moduleRegistration.registerFactory(id, visibility, lifetime, factory)

        return registrationApi
      },

      registerValue(
        id: Id,
        value: Instance,
        {visibility = Visibility.Private}: InstanceOptions = {},
      ): ContainerRegistrationApi {
        if (value === undefined && arguments.length < 2) {
          throw new Error(`Can't register '${id}' - value not defined`)
        }

        moduleRegistration.registerInstance(id, visibility, value)

        return registrationApi
      },

      registerSubmodule(
        id: Id,
        {visibility = Visibility.Private}: ModuleOptions = {},
      ): ContainerRegistrationApi {
        moduleRegistration.registerModule(id, visibility)

        return createRegistrationApi(moduleRegistration.forSubModule(id))
      },
    }
    return registrationApi
  }

  const containerExternalApi: ContainerExternalApi = {
    resolve(id: Id): Instance {
      return internal.resolve(id)
    },

    child(childContainerName: string): Container {
      if (!childContainerName) {
        throw new Error("Must provide container name")
      }
      const path = internal.visiblePathToContainer(childContainerName)
      if (path) {
        const pathString = path.join(" -> ")
        throw new Error(
          `Cannot use container name '${childContainerName}': parent container named '${childContainerName}' already exists: ${pathString}`,
        )
      }
      return _createContainer({
        containerName: childContainerName,
        parentContainerInternal: internal,
      })
    },

    getDebugInfo() {
      return internal.getDebugInfo()
    },
  }

  return Object.assign(
    {},
    createRegistrationApi(createModuleRegistrationApi(rootModuleReg)),
    containerExternalApi,
  )
}
