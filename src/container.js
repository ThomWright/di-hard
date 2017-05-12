module.exports = () => {
  function _createContainer({
    scope,
    parent,
  }) {
    const instances = {}
    const registry = {}

    function createResolver(dependencyPath) {
      return new Proxy({}, {
        get(target, name) {
          const id = name

          // check for circular dependencies
          if (dependencyPath.includes(id)) {
            const error = new Error("Circular dependencies")
            error.dependencyDiagram = [...dependencyPath, id].join(" -> ")
            throw error
          }

          // return an existing instance from this scope if we have one
          const cachedInstance = instances[id]
          if (cachedInstance) {
            return cachedInstance
          }

          // try to create a new instance
          const factory = registry[id]
          if (!factory) {
            if (parent) {
              // if we can't do it in this scope, see if a parent can
              return parent.resolve(id)
            }
            throw new Error(
              `Nothing registered for id: ${id}`
            )
          }

          const dependencyPathToThisInstance = [...dependencyPath, id]
          const resolver = createResolver(dependencyPathToThisInstance)
          const instance = factory(resolver)
          instances[id] = instance
          return instance
        },

        set(target, name, value) {
          throw new Error(`Can't set values on the resolver. Attempted to set '${name}' to '${value}'.`)
        },
      })
    }

    const internal = {
      resolve(id) {
        return createResolver([])[id]
      },

      searchPath() {
        if (!parent) {
          return [scope]
        }
        return [scope, ...parent.searchPath()]
      },
      pathToScope(targetScope) {
        if (targetScope === scope) {
          return [scope]
        }
        if (!parent) {
          return undefined
        }
        const parentScopes = parent.pathToScope(targetScope)
        if (parentScopes) {
          return [scope, ...parentScopes]
        }
        return undefined
      },
    }

    return {
      registerFactory(id, factory) {
        if (typeof factory !== "function") {
          throw new Error(`Can't register '${id}' as a factory - it is not a function`)
        }
        if (registry.hasOwnProperty(id)) {
          throw new Error(`Cannot register '${id}' - already registered`)
        }
        if (instances.hasOwnProperty(id)) {
          throw new Error(`Cannot register '${id}' - already registered as a value`)
        }
        registry[id] = factory
      },

      registerValue(id, value) {
        if (registry.hasOwnProperty(id)) {
          throw new Error(`Cannot register '${id}' - already registered`)
        }
        if (instances.hasOwnProperty(id)) {
          throw new Error(`Cannot register '${id}' - already registered as a value`)
        }
        instances[id] = value
      },

      resolve(id) {
        try {
          return internal.resolve(id)
        } catch (error) {
          error.searchPath = `${internal.searchPath().join(" -> ")} (root)`
          throw error
        }
      },

      child(scope) {
        const path = internal.pathToScope(scope)
        if (path) {
          const pathString = path.join(" -> ")
          throw new Error(
            `Cannot use scope name '${scope}': parent container named '${scope}' already exists: ${pathString}`
          )
        }
        return _createContainer({
          scope,
          parent: internal,
        })
      },
    }
  }

  function createContainer(scope) {
    return _createContainer({
      scope,
      parent: undefined,
    })
  }

  return {
    createContainer,
  }
}
