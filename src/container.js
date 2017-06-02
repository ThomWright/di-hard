const lifetimes = require("./lifetimes")

module.exports = () => {
  function _createContainer({
    containerName,
    parent,
  }) {
    const instances = {}
    const factories = {}

    function createResolver({
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

    const internal = {
      resolve(id, previousDependencyPath = [], previouslySearchedContainers = []) {
        return createResolver({previousDependencyPath, previouslySearchedContainers})[id]
      },

      // return the list of visible containers, in order of traversal
      visibleScope() {
        if (!parent) {
          return [containerName]
        }
        return [containerName, ...parent.visibleScope()]
      },

      // return the path from this container to targetContainer, or undefined if targetContainer is not visible
      visiblePathToContainer(targetContainer) {
        if (targetContainer === containerName) {
          return [containerName]
        }
        if (!parent) {
          return undefined
        }
        const parentContainers = parent.visiblePathToContainer(targetContainer)
        if (parentContainers) {
          return [containerName, ...parentContainers]
        }
        return undefined
      },
    }

    const api = {
      registerFactory(id, factory, lifetime) {
        if (typeof factory !== "function") {
          throw new Error(`Can't register '${id}' as a factory - it is not a function`)
        }
        check(factories, instances, id)
        if (lifetime && !lifetimes.hasOwnProperty(lifetime)) {
          throw new Error(`Cannot register '${id}' - unknown lifetime '${lifetime}'`)
        }
        if (arguments.length >= 3 && !lifetime) {
          throw new Error(`Cannot register '${id}' - lifetime is set but not defined`)
        }
        if (!lifetime) {
          lifetime = lifetimes.TRANSIENT
        }
        factories[id] = {factory, lifetime}

        return api
      },

      registerValues(values) {
        if (typeof values !== "object") {
          throw new Error("Cannot register values - not an object")
        }
        Object.keys(values).forEach((id) => api.registerValue(id, values[id]))
        return api
      },

      registerValue(id, value) {
        check(factories, instances, id)
        if (value === undefined && arguments.length < 2) {
          throw new Error(`Can't register '${id}' - value not defined`)
        }
        instances[id] = value

        return api
      },

      resolve(id) {
        return internal.resolve(id)
      },

      child(containerName) {
        if (!containerName) {
          throw new Error("Must provide container name")
        }
        const path = internal.visiblePathToContainer(containerName)
        if (path) {
          const pathString = path.join(" -> ")
          throw new Error(
            `Cannot use container name '${containerName}': parent container named '${containerName}' already exists: ${pathString}`
          )
        }
        return _createContainer({
          containerName,
          parent: internal,
        })
      },
    }
    return api
  }

  function createContainer(containerName) {
    if (!containerName) {
      throw new Error("Must provide container name")
    }
    return _createContainer({
      containerName,
      parent: undefined,
    })
  }

  return {
    createContainer,
  }
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

function check(factories, instances, id) {
  if (factories.hasOwnProperty(id)) {
    throw new Error(`Cannot register '${id}' - already registered as a factory`)
  }
  if (instances.hasOwnProperty(id)) {
    throw new Error(`Cannot register '${id}' - already registered as a value`)
  }
  if (typeof id !== "string") {
    throw new Error(`Cannot register '${id}' - ID must be a string`)
  }
}
