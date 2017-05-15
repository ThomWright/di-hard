const lifetimes = require("./lifetimes")

module.exports = () => {
  function _createContainer({
    scope,
    parent,
  }) {
    const instances = {}
    const factories = {}

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
          if (instances.hasOwnProperty(id)) {
            return instances[id]
          }

          // try to create a new instance
          const registration = factories[id]
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

    const api = {
      registerFactory(id, factory, lifetime) {
        if (typeof factory !== "function") {
          throw new Error(`Can't register '${id}' as a factory - it is not a function`)
        }
        check(factories, instances, id)
        if (lifetime && !lifetimes.hasOwnProperty(lifetime)) {
          throw new Error(`Cannot register '${id}' - unknown lifetime '${lifetime}'`)
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
    return api
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
