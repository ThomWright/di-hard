const lifetimes = require("./lifetimes")
const createResolver = require("./resolver")
const {
  createModule,
  getSubModule,
  parseModulePath,
  splitModulePath,
  createRegistrationApi: createModuleRegistrationApi,
} = require("./modules")
const {
  visibilities,
  addVisibility,
} = require("./visibility")
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

      // TODO make lifetime/visibility an options object
      registerFactory(id, factory, {lifetime = lifetimes.TRANSIENT, visibility = visibilities.PRIVATE} = {}) {
        if (typeof factory !== "function") {
          throw new Error(`Can't register '${id}' as a factory - it is not a function`)
        }

        try {
          lifetimes[lifetime] // ensures we're using a valid lifetime
          visibilities[visibility] // ensures we're using a valid visibility
        } catch (e) {
          throw new Error(`Can't register '${id}' as a factory - ${e.message}`)
        }

        const component = addVisibility(visibility, {
          factory,
          lifetime,
        })
        moduleRegistration.registerFactory(id, component)

        return registrationApi
      },

      registerValue(id, value, {visibility = visibilities.PRIVATE} = {}) {
        if (value === undefined && arguments.length < 2) {
          throw new Error(`Can't register '${id}' - value not defined`)
        }

        try {
          visibilities[visibility] // ensures we're using a valid visibility
        } catch (e) {
          throw new Error(`Can't register '${id}' as a value - ${e.message}`)
        }

        const component = addVisibility(visibility, {
          instance: value,
        })
        moduleRegistration.registerInstance(id, component)

        return registrationApi
      },

      registerSubmodule(id, {visibility = visibilities.PRIVATE} = {}) {
        try {
          visibilities[visibility] // ensures we're using a valid visibility
        } catch (e) {
          throw new Error(`Can't register '${id}' as a submodule - ${e.message}`)
        }

        const component = addVisibility(visibility, createModule())
        moduleRegistration.registerModule(id, component)

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
