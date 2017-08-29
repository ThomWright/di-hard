const lifetimes = require("./lifetimes")
const createResolver = require("./resolver")
const getDebugInfo = require("./debug-info")

module.exports = () => {
  return {
    createContainer(containerName) {
      if (!containerName) {
        throw new Error("Must provide container name")
      }
      return _createContainer({
        containerName,
        parentContainer: undefined,
      })
    },
  }
}

function _createContainer({
  containerName,
  parentContainer,
}) {
  const rootModule = {
    instances: {},
    factories: {},
  }

  const internal = {
    resolve(id, previousDependencyPath = [], previouslySearchedContainers = []) {
      return createResolver({
        containerName,
        parentContainer,
        rootModule,
        previousDependencyPath,
        previouslySearchedContainers,
      })[id]
    },

    getDebugInfo() {
      return getDebugInfo({
        containerName,
        parentContainer,
        rootModule,
      })
    },

    // return the path from this container to targetContainer, or undefined if targetContainer is not visible
    visiblePathToContainer(targetContainer) {
      if (targetContainer === containerName) {
        return [containerName]
      }
      if (!parentContainer) {
        return undefined
      }
      const parentContainers = parentContainer.visiblePathToContainer(targetContainer)
      if (parentContainers) {
        return [containerName, ...parentContainers]
      }
      return undefined
    },
  }

  function createRegistrationApi() {
    const registrationApi = {
      registerFactory(id, factory, lifetime) {
        if (typeof factory !== "function") {
          throw new Error(`Can't register '${id}' as a factory - it is not a function`)
        }
        check(rootModule.factories, rootModule.instances, id)
        if (lifetime && !lifetimes.hasOwnProperty(lifetime)) {
          throw new Error(`Cannot register '${id}' - unknown lifetime '${lifetime}'`)
        }
        if (arguments.length >= 3 && !lifetime) {
          throw new Error(`Cannot register '${id}' - lifetime is set but not defined`)
        }
        if (!lifetime) {
          lifetime = lifetimes.TRANSIENT
        }
        rootModule.factories[id] = {factory, lifetime}

        return registrationApi
      },

      registerValue(id, value) {
        check(rootModule.factories, rootModule.instances, id)
        if (value === undefined && arguments.length < 2) {
          throw new Error(`Can't register '${id}' - value not defined`)
        }
        rootModule.instances[id] = value

        return registrationApi
      },
    }
    return registrationApi
  }

  return Object.assign(
    {},
    createRegistrationApi(),
    {
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
          parentContainer: internal,
        })
      },

      getDebugInfo() {
        return internal.getDebugInfo()
      },
    }
  )
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
