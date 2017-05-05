const bluebird = require("bluebird")

module.exports = ({
  stdio,
}) => {
  function _createContainer({
    // scope,
    parent,
    registry,
  }) {
    const instances = {}

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
        // TODO check scope !== global
        return _createContainer({
          scope,
          parent: container,
          registry: {},
        })
      },
    }
    return container
  }

  function createGlobalContainer() {
    return _createContainer({
      scope: "global",
      parent: undefined,
      registry: {},
    })
  }

  return {
    createContainer: createGlobalContainer,
  }
}
