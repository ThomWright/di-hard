const lifetimes = require("./lifetimes")
const createResolver = require("./resolver")
const {
  createModule,
  getSubModule,
  parseModulePath,
  splitModulePath,
  createRegistrationApi: createModuleRegistrationApi,
} = require("./modules")
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
  const rootModule = createModule()

  const internal = {
    resolve(formattedModulePath, previousDependencyPath = [], previouslySearchedContainers = []) {
      const fullComponentPath = parseModulePath(formattedModulePath)
      const {parentModulePath, componentId} = splitModulePath(fullComponentPath)
      const mod = getSubModule(rootModule, parentModulePath)
      return createResolver({
        containerName,
        forComponent: rootModule,
        parentContainer,
        rootModule,
        fromModule: mod,
        previousDependencyPath,
        previouslySearchedContainers,
      })[componentId]
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

  function createRegistrationApi(moduleRegistration) {
    const registrationApi = {
      registerFactory(id, factory, lifetime) {
        if (typeof factory !== "function") {
          throw new Error(`Can't register '${id}' as a factory - it is not a function`)
        }

        if (lifetime && !lifetime in lifetimes) {
          throw new Error(`Cannot register '${id}' - unknown lifetime '${lifetime}'`)
        }
        if (arguments.length >= 3 && !lifetime) {
          throw new Error(`Cannot register '${id}' - lifetime is set but not defined`)
        }
        if (!lifetime) {
          lifetime = lifetimes.TRANSIENT
        }

        moduleRegistration.registerFactory(id, {
          factory,
          lifetime,
        })

        return registrationApi
      },

      registerValue(id, value) {
        if (value === undefined && arguments.length < 2) {
          throw new Error(`Can't register '${id}' - value not defined`)
        }

        moduleRegistration.registerInstance(id, {
          instance: value,
        })

        return registrationApi
      },

      registerSubmodule(id) {
        moduleRegistration.registerModule(id, createModule())

        return createRegistrationApi(moduleRegistration.forSubModule(id))
      },
    }
    return registrationApi
  }

  return Object.assign(
    {},
    createRegistrationApi(createModuleRegistrationApi(rootModule)),
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
