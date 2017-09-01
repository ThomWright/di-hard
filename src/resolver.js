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
      const fqn = [...fromModule, id].join(".")
      // console.log(`Resolving: '${fqn}' into '${forComponent.join(".")}'`)

      // check for circular dependencies
      const dependencyPath = [...previousDependencyPath, {fqn, containerName}]
      if (previousDependencyPath.find(sameIdAndContainer({fqn, containerName}))) {
        throw new Error(`Circular dependencies: '${formatDepPath(dependencyPath)}'`)
      }

      const mod = getSubModule(fromModule, rootModule)

      // return an existing instance from this container if we have one
      if (mod.instances.hasOwnProperty(id)) {
        return mod.instances[id].instance
      }

      if (mod.modules[id]) {
        // return a resolver for the specified submodule
        return createResolver({
          containerName,
          forComponent,
          parentContainer,
          rootModule,
          fromModule: [...fromModule, id],
          previousDependencyPath,
        })
      }

      // try to create a new instance
      const factoryReg = mod.factories[id]
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
          `Nothing registered for '${fqn}' in containers: '${searchedContainers.join(" -> ")}'.` +
          ` Trying to resolve: '${formatDepPath(dependencyPath)}'.`
        )
      }

      // create a new instance
      const {factory, lifetime} = factoryReg
      const resolver = createResolver({
        containerName,
        forComponent: [...fromModule, id],
        parentContainer,
        rootModule,
        fromModule: [],
        previousDependencyPath: dependencyPath,
      })
      const instance = factory(resolver)

      if (lifetime !== lifetimes.TRANSIENT) {
        // cache the instance for the lifetime of this containerName
        mod.instances[id] = {
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
  return dependencyPath.map(d => `${d.fqn} (${d.containerName})`).join(" -> ")
}

function sameIdAndContainer({fqn, containerName}) {
  return (other) => {
    return other.fqn === fqn
      && other.containerName === containerName
  }
}

function getSubModule(modulePath, currentModule) {
  let targetModule = currentModule
  modulePath.forEach((modId) => {
    targetModule = targetModule.modules[modId]
  })
  return targetModule
}
