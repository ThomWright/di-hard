const {
  formatModulePath,
  joinModulePath,
  isPathEqual: sameModulePath,
  getInstance,
  getFactory,
  getModule,
  getModulePath,
  exists,
  cacheInstance,
} = require("./modules")
const lifetimes = require("./lifetimes")
const {forRootModule} = require("./visibility")

module.exports = function createResolver({
  containerName,
  forComponent,
  parentContainer,
  rootModule,
  fromModule,
  previousDependencyPath = [],
  previouslySearchedContainers = [],
}) {
  const intoModulePath = getModulePath(forComponent)
  const isVisibleFrom = forRootModule(rootModule)
  const isVisible = isVisibleFrom(intoModulePath)

  return new Proxy({}, {
    get(_, id) { // eslint-disable-line complexity
      const componentModulePath = joinModulePath(getModulePath(fromModule), id)
      const formattedModulePath = formatModulePath(componentModulePath)
      // console.log(`Resolving: '${formattedModulePath}' into '${formatModulePath(forComponent.modulePath)}'`)

      const dependencyPath = [...previousDependencyPath, {componentModulePath, containerName}]

      if (!exists(fromModule, id)) {
        // if we can't resolve anything in this container, see if a parentContainer can
        const searchedContainers = [...previouslySearchedContainers, containerName]
        if (!parentContainer) {
          throw new Error(
            `Nothing registered for '${formattedModulePath}' in containers: '${searchedContainers.join(" -> ")}'.` +
            ` Trying to resolve: '${formatDepPath(dependencyPath)}'.`
          )
        }
        return parentContainer.resolve(
          id,
          previousDependencyPath,
          searchedContainers
        )
      }

      if (!isVisible(componentModulePath)) {
        throw new Error(`'${formattedModulePath}' is not visible to '${intoModulePath}'`)
      }

      // check for circular dependencies
      if (previousDependencyPath.find(sameIdAndContainer({componentModulePath, containerName}))) {
        throw new Error(`Circular dependencies: '${formatDepPath(dependencyPath)}'`)
      }

      {
        // return an existing instance from this container if we have one
        const instanceReg = getInstance(fromModule, id)
        if (instanceReg) {
          return instanceReg.instance
        }
      }

      {
        const mod = getModule(fromModule, id)
        if (mod) {
          // return a resolver for the specified submodule
          return createResolver({
            containerName,
            forComponent,
            parentContainer,
            rootModule,
            fromModule: mod,
            previousDependencyPath,
          })
        }
      }

      {
        // try to create a new instance
        const factoryReg = getFactory(fromModule, id)
        if (factoryReg) {
          // create a new instance
          const {factory, lifetime} = factoryReg
          const resolver = createResolver({
            containerName,
            forComponent: factoryReg,
            parentContainer,
            rootModule,
            fromModule: rootModule,
            previousDependencyPath: dependencyPath,
          })
          const instance = factory(resolver)

          if (lifetime === lifetimes.REGISTRATION) {
            cacheInstance(fromModule, id, {instance})
          }
          return instance
        }
      }

      throw new Error("oh no") // FIXME
    },
    set(target, name, value) {
      throw new Error(`Can't set values on the resolver. Attempted to set '${name}' to '${value}'.`)
    },
  })
}

function formatDepPath(dependencyPath) {
  return dependencyPath
    .map(d => `${formatModulePath(d.componentModulePath)} (${d.containerName})`)
    .join(" -> ")
}

function sameIdAndContainer({componentModulePath, containerName}) {
  return (other) => {
    return sameModulePath(other.componentModulePath, componentModulePath)
      && other.containerName === containerName
  }
}
