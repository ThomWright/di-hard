const {
  formatModulePath,
  joinModulePath,
  isPathEqual: sameModulePath,
} = require("./modules")
const lifetimes = require("./lifetimes")

module.exports = function createResolver({
  containerName,
  forComponent,
  parentContainer,
  rootModule,
  fromModule,
  previousDependencyPath = [],
  previouslySearchedContainers = [],
}) {

  return new Proxy({}, {
    get(target, propertyName) {
      const id = propertyName
      const componentModulePath = joinModulePath(fromModule.modulePath, id)
      const formattedModulePath = formatModulePath(componentModulePath)
      // console.log(`Resolving: '${formattedModulePath}' into '${formatModulePath(forComponent.modulePath)}'`)

      // check for circular dependencies
      const dependencyPath = [...previousDependencyPath, {componentModulePath, containerName}]
      if (previousDependencyPath.find(sameIdAndContainer({componentModulePath, containerName}))) {
        throw new Error(`Circular dependencies: '${formatDepPath(dependencyPath)}'`)
      }

      // return an existing instance from this container if we have one
      if (fromModule.instances.hasOwnProperty(id)) {
        return fromModule.instances[id].instance
      }

      if (fromModule.modules[id]) {
        // return a resolver for the specified submodule
        return createResolver({
          containerName,
          forComponent,
          parentContainer,
          rootModule,
          fromModule: fromModule.modules[id],
          previousDependencyPath,
        })
      }

      // try to create a new instance
      const factoryReg = fromModule.factories[id]
      if (!factoryReg) {
        const searchedContainers = [...previouslySearchedContainers, containerName]
        if (parentContainer) {
          // if we can't do it in this container, see if a parentContainer can
          return parentContainer.resolve(
            id,
            previousDependencyPath,
            searchedContainers
          )
        }
        throw new Error(
          `Nothing registered for '${formattedModulePath}' in containers: '${searchedContainers.join(" -> ")}'.` +
          ` Trying to resolve: '${formatDepPath(dependencyPath)}'.`
        )
      }

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

      if (lifetime !== lifetimes.TRANSIENT) {
        // cache the instance for the lifetime of this containerName
        fromModule.instances[id] = {
          instance,
        }
      }

      return instance
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
