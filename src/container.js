const bluebird = require("bluebird")

module.exports = ({
  stdio,
}) => {
  function _createContainer({
    scope,
    parent,
    registry,
  }) {
    const instances = {}

    const private = {
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

    const container =  {
      register(definition) {
        const {identifier} = definition
        if (!identifier) {
          throw new Error(`Cannot register without an identifier. Found keys: ${Object.keys(definition)}`)
        }
        if (registry[identifier]) {
          stdio.write(`Overwriting ${identifier}`)
        }
        registry[identifier] = definition
      },

      get(identifier) {
        const cachedInstance = instances[identifier]
        if (cachedInstance) {
          return Promise.resolve(cachedInstance)
        }

        const definition = registry[identifier]
        if (!definition) {
          if (parent) {
            return parent.get(identifier)
          }
          stdio.write(`Nothing registered for identifier: ${identifier}`)
          return Promise.resolve()
        }

        const promisesForDeps = {}
        const dependencyNames = definition.inject
        dependencyNames && dependencyNames.forEach(
          (identifier) => promisesForDeps[identifier] = container.get(identifier)
        )

        const factory = definition.factory

        return bluebird.props(promisesForDeps)
          .then((resolvedDeps) => {
            return factory(resolvedDeps)
          })
          .then((newInstance) => {
            instances[identifier] = newInstance
            return newInstance
          })
      },

      child(scope) {
        const path = private.pathToScope(scope)
        if (path) {
          const pathString = path.join("->")
          throw new Error(
            `Cannot use scope name '${scope}': parent container named '${scope}' already exists: ${pathString}`
          )
        }
        return _createContainer({
          scope,
          parent: Object.assign({}, container, private),
          registry: {},
        })
      },
    }
    return container
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
