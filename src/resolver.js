const lifetimes = require("./lifetimes")

module.exports = function createResolver({
  containerName,
  parent,
  instances,
  factories,
  previousDependencyPath = [],
  previouslySearchedContainers = [],
}) {
  return new Proxy({}, {
    get(target, propertyName) {
      const id = propertyName

      // check for circular dependencies
      const dependencyPath = [...previousDependencyPath, {id, containerName}]
      if (previousDependencyPath.find(sameIdAndContainer({id, containerName}))) {
        throw new Error(`Circular dependencies: '${formatDepPath(dependencyPath)}'`)
      }

      // return an existing instance from this container if we have one
      if (instances.hasOwnProperty(id)) {
        return instances[id]
      }

      // try to create a new instance
      const registration = factories[id]
      if (!registration) {
        const searchedContainers = [...previouslySearchedContainers, containerName]
        if (parent) {
          // if we can't do it in this container, see if a parent can
          return parent.resolve(
            id,
            previousDependencyPath,
            searchedContainers
          )
        }
        throw new Error(
          `Nothing registered for ID '${id}' in containers: '${searchedContainers.join(" -> ")}'.` +
          ` Trying to resolve: '${formatDepPath(dependencyPath)}'.`
        )
      }

      // create a new instance
      const {factory, lifetime} = registration
      const resolver = createResolver({
        containerName,
        parent,
        instances,
        factories,
        previousDependencyPath: dependencyPath,
      })
      const instance = factory(resolver)

      if (lifetime !== lifetimes.TRANSIENT) {
        // cache the instance for the lifetime of this containerName
        instances[id] = instance
      }

      return instance
    },
    set(target, name, value) {
      throw new Error(`Can't set values on the resolver. Attempted to set '${name}' to '${value}'.`)
    },
  })
}

function formatDepPath(dependencyPath) {
  return dependencyPath.map(d => `${d.id} (${d.containerName})`).join(" -> ")
}

function sameIdAndContainer({id, containerName}) {
  return (other) => {
    return other.id === id
      && other.containerName === containerName
  }
}
