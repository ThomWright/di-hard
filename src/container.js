
module.exports = ({
  stdio,
}) => {
  function _createContainer({
    // context,
    parent,
    registry,
  }) {
    const instances = {}

    const container =  {
      register(definition) {
        const name = definition.name
        if (registry[name]) {
          stdio.write(`Overwriting ${name}`)
        }
        registry[name] = definition
      },
      get(name) {
        const instance = instances[name]
        if (instance) {
          return instance
        }

        const definition = registry[name]
        if (!definition) {
          if (parent) {
            return parent.get(name)
          }
          stdio.write(`Nothing registered for name: ${name}`)
          return undefined
        }

        const deps = {}
        const dependencyNames = definition.inject
        dependencyNames && dependencyNames.forEach((name) => deps[name] = container.get(name))

        const factory = definition.factory
        const newInstance = factory(deps)
        instances[name] = newInstance
        return newInstance
      },

      child(context) {
        // TODO check context !== global
        return _createContainer({
          context,
          parent: container,
          registry: {},
        })
      },
    }
    return container
  }

  function createGlobalContainer() {
    return _createContainer({
      context: "global",
      parent: undefined,
      registry: {},
    })
  }

  function define(definition) {
    if (!definition.name) {
      throw new Error("Definition must contain a name")
    }
    return definition
  }

  return {
    createContainer: createGlobalContainer,
    define,
  }
}
