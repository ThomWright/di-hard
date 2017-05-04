
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
        const instance = instances[identifier]
        if (instance) {
          return instance
        }

        const definition = registry[identifier]
        if (!definition) {
          if (parent) {
            return parent.get(identifier)
          }
          stdio.write(`Nothing registered for identifier: ${identifier}`)
          return undefined
        }

        const deps = {}
        const dependencyNames = definition.inject
        dependencyNames && dependencyNames.forEach((identifier) => deps[identifier] = container.get(identifier))

        const factory = definition.factory
        const newInstance = factory(deps)
        instances[identifier] = newInstance
        return newInstance
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
