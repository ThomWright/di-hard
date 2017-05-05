const bluebird = require("bluebird")

module.exports = ({
  // stdio,
}) => {
  function _createContainer({
    scope,
    parent,
    registry,
  }) {
    const instances = {}

    const internal = {
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

      _get(id) {
        const cachedInstance = instances[id]
        if (cachedInstance) {
          return Promise.resolve(cachedInstance)
        }

        const definition = registry[id]
        if (!definition) {
          if (parent) {
            return parent._get(id)
          }
          return Promise.reject(new Error(
            `Nothing registered for id: ${id}`
          ))
        }

        const promisesForDeps = {}
        const dependencyNames = definition.inject
        dependencyNames && dependencyNames.forEach(
          (id) => promisesForDeps[id] = internal._get(id)
        )

        const factory = definition.factory

        return bluebird.props(promisesForDeps)
          .then((resolvedDeps) => {
            return factory(resolvedDeps)
          })
          .then((newInstance) => {
            instances[id] = newInstance
            return newInstance
          })
      },
    }

    return {
      register(definition) {
        const {id} = definition
        if (!id) {
          throw new Error(`Cannot register without an id. Found keys: ${Object.keys(definition)}`)
        }
        if (registry[id]) {
          throw new Error(`Overwriting ${id}`)
        }
        registry[id] = definition
      },

      get(id) {
        return internal._get(id)
          .catch((error) => {
            error.searchPath = internal.searchPath().join("->")
            throw error
          })
      },

      child(scope) {
        const path = internal.pathToScope(scope)
        if (path) {
          const pathString = path.join("->")
          throw new Error(
            `Cannot use scope name '${scope}': parent container named '${scope}' already exists: ${pathString}`
          )
        }
        return _createContainer({
          scope,
          parent: internal,
          registry: {},
        })
      },
    }
  }

  function createContainer(scopeName) {
    return _createContainer({
      scope: scopeName,
      parent: undefined,
      registry: {},
    })
  }

  return {
    createContainer,
  }
}
