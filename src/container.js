const lifetimes = require("./lifetimes")

module.exports = () => {
  function _createContainer({
    scope,
    parent,
  }) {
    const instances = {}
    const registry = {}

    function createResolver({
      previousDependencyPath = [],
      previouslySearchedScopes = [],
    }) {
      return new Proxy({}, {
        get(target, name) {
          const id = name

          // check for circular dependencies
          const dependencyPath = [...previousDependencyPath, {id, scope}]
          if (previousDependencyPath.find(sameIdAndScope({id, scope}))) {
            throw new Error(`Circular dependencies: '${formatDepPath(dependencyPath)}'`)
          }

          // return an existing instance from this scope if we have one
          const cachedInstance = instances[id]
          if (cachedInstance) {
            return cachedInstance
          }

          // try to create a new instance
          const registration = registry[id]
          if (!registration) {
            const searchedScopes = [...previouslySearchedScopes, scope]
            if (parent) {
              // if we can't do it in this scope, see if a parent can
              return parent.resolve(
                id,
                previousDependencyPath,
                searchedScopes
              )
            }
            throw new Error(
              `Nothing registered for ID '${id}' in scopes: '${searchedScopes.join(" -> ")}'.` +
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
            // cache the instance for the lifetime of this scope
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
      resolve(id, previousDependencyPath = [], previouslySearchedScopes = []) {
        return createResolver({previousDependencyPath, previouslySearchedScopes})[id]
      },

      // return the list of visible scopes, in order of traversal
      visibleScopes() {
        if (!parent) {
          return [scope]
        }
        return [scope, ...parent.visibleScopes()]
      },

      // return the path from this scope to targetScope, or undefined if targetScope is not visible
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
      registerFactory(id, factory, lifetime) {
        if (typeof factory !== "function") {
          throw new Error(`Can't register '${id}' as a factory - it is not a function`)
        }
        if (registry.hasOwnProperty(id)) {
          throw new Error(`Cannot register '${id}' - already registered`)
        }
        if (instances.hasOwnProperty(id)) {
          throw new Error(`Cannot register '${id}' - already registered as a value`)
        }
        if (lifetime && !lifetimes.hasOwnProperty(lifetime)) {
          throw new Error(`Cannot register '${id}' - unknown lifetime '${lifetime}'`)
        }
        if (!lifetime) {
          lifetime = lifetimes.TRANSIENT
        }
        registry[id] = {factory, lifetime}
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
        return internal.resolve(id)
      },

      child(scope) {
        if (!scope) {
          throw new Error("Must provide scope name")
        }
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
    if (!scope) {
      throw new Error("Must provide scope name")
    }
    // TODO insist on scope name
    return _createContainer({
      scope,
      parent: undefined,
    })
  }

  return {
    createContainer,
  }
}

function formatDepPath(dependencyPath) {
  return dependencyPath.map(d => `${d.id} (${d.scope})`).join(" -> ")
}

function sameIdAndScope({id, scope}) {
  return (other) => {
    return other.id === id
      && other.scope === scope
  }
}
