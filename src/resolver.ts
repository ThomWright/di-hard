// tslint:disable-next-line no-var-requires
const leven = require("leven")
import {
  Id,
  ComponentRegistration,
  ModuleRegistration,
  ModulePath,
  Instance,
  formatModulePath,
  joinModulePath,
  isPathEqual as sameModulePath,
  exists,
  cacheInstance,
  getAllResolvableIds,
} from "./modules"
import {ContainerInternalApi} from "./container"
import Lifetime from "./lifetimes"
import {forRootModule} from "./visibility"

export type Resolver = Record<Id, Instance>

export interface LocationInfo {
  containerName: string
  componentModulePath: ModulePath
}

export default function createResolver({
  containerName,
  forComponent,
  parentContainer,
  rootModuleReg,
  fromModuleReg,

  previousDependencyPath = [],
  previouslySearchedContainers = [],
  previouslyResolvableIds = [],
}: {
  containerName: string
  forComponent: ComponentRegistration
  parentContainer?: ContainerInternalApi
  rootModuleReg: ModuleRegistration
  fromModuleReg: ModuleRegistration

  previousDependencyPath: LocationInfo[]
  previouslySearchedContainers: string[]
  previouslyResolvableIds: Array<Set<Id>>
}): Resolver {
  const intoModulePath = forComponent.modulePath
  const isVisibleFrom = forRootModule(rootModuleReg)
  const isVisible = isVisibleFrom(intoModulePath)

  return new Proxy(
    {},
    {
      get(_, id): Instance {
        if (typeof id !== "string") {
          throw new Error("come on now")
        }

        // eslint-disable-line complexity, max-statements
        const componentModulePath = joinModulePath(fromModuleReg.modulePath, id)
        const formattedModulePath = formatModulePath(componentModulePath)
        // console.log(`Resolving: '${formattedModulePath}' into '${formatModulePath(forComponent.modulePath)}'`)

        const dependencyPath = [
          ...previousDependencyPath,
          {componentModulePath, containerName},
        ]

        if (!exists(fromModuleReg.module, id)) {
          // if we can't resolve anything in this container, see if a parentContainer can
          const searchedContainers: string[] = [
            ...previouslySearchedContainers,
            containerName,
          ]

          if (!parentContainer) {
            const resolvableIds = new Set([
              ...getAllResolvableIds(fromModuleReg.module),
              ...previouslyResolvableIds.reduce<string[]>(
                (accArray, set) => accArray.concat(...set),
                [],
              ),
            ])
            const typoSuggestions = getCloselyMatchingIds(id, resolvableIds)
            throw new Error(
              `Nothing registered for '${formattedModulePath}' in containers: '${searchedContainers.join(
                " -> ",
              )}'.` +
                ` Trying to resolve: '${formatDepPath(dependencyPath)}'.` +
                typoSuggestions,
            )
          }

          return parentContainer.resolve(
            id,
            previousDependencyPath,
            searchedContainers,
            [
              getAllResolvableIds(fromModuleReg.module),
              ...previouslyResolvableIds,
            ],
          )
        }

        if (!isVisible(componentModulePath)) {
          throw new Error(
            `'${formattedModulePath}' is not visible to '${intoModulePath}'`,
          )
        }

        // check for circular dependencies
        if (
          previousDependencyPath.find(
            sameIdAndContainer({componentModulePath, containerName}),
          )
        ) {
          throw new Error(
            `Circular dependencies: '${formatDepPath(dependencyPath)}'`,
          )
        }

        {
          // return an existing instance from this container if we have one
          const instanceReg = fromModuleReg.module.instances[id]
          if (instanceReg) {
            return instanceReg.instance
          }
        }

        {
          const mod = fromModuleReg.module.modules[id]
          if (mod) {
            // return a resolver for the specified submodule
            return createResolver({
              containerName,
              forComponent,
              parentContainer,
              rootModuleReg,
              fromModuleReg: mod,
              previousDependencyPath,
              previouslySearchedContainers,
              previouslyResolvableIds,
            })
          }
        }

        {
          // try to create a new instance
          const factoryReg = fromModuleReg.module.factories[id]
          if (factoryReg) {
            // create a new instance
            const {factory, lifetime} = factoryReg
            const resolver = createResolver({
              containerName,
              forComponent: factoryReg,
              parentContainer,
              rootModuleReg,
              fromModuleReg: rootModuleReg,
              previousDependencyPath: dependencyPath,
              previouslySearchedContainers,
              previouslyResolvableIds,
            })
            const instance = factory(resolver)

            if (lifetime === Lifetime.Registration) {
              cacheInstance(fromModuleReg, id, factoryReg.visibility, instance)
            }
            return instance
          }
        }

        throw new Error("oh no") // FIXME
      },

      set(_, name: PropertyKey, value: any): boolean {
        throw new Error(
          `Can't set values on the resolver. Attempted to set '${String(
            name,
          )}' to '${value}'.`,
        )
      },
    },
  )
}

function formatDepPath(dependencyPath: LocationInfo[]): string {
  return dependencyPath
    .map(d => `${formatModulePath(d.componentModulePath)} (${d.containerName})`)
    .join(" -> ")
}

function sameIdAndContainer({
  componentModulePath,
  containerName,
}: LocationInfo) {
  return (other: LocationInfo) => {
    return (
      sameModulePath(other.componentModulePath, componentModulePath) &&
      other.containerName === containerName
    )
  }
}

function getCloselyMatchingIds(id: Id, ids: Set<Id>): string {
  const closeIds: Id[] = []
  ids.forEach(otherId => {
    if (leven(id, otherId) <= 3) {
      closeIds.push(otherId)
    }
  })

  return closeIds.length === 0
    ? ""
    : " " +
        (closeIds.length === 1
          ? `Did you mean: ${closeIds[0]}?`
          : `Did you mean one of: ${closeIds}?`)
}
