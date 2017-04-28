const DEP_LIST_PROP_NAME = "__deps__"

module.exports = ({
  stdio,
}) => {
  function _createContainer({
    // context,
    parent,
    factories,
  }) {
    const instances = {}

    const container =  {
      register(key, factory) {
        if (factories[key]) {
          stdio.write(`Overwriting ${key}`)
        }
        factories[key] = factory
      },
      get(key) {
        const instance = instances[key]
        if (instance) {
          return instance
        }

        const factory = factories[key]
        if (!factory) {
          if (parent) {
            return parent.get(key)
          }
          stdio.write(`Nothing registered for key: ${key}`)
          return undefined
        }

        const deps = {}
        const depList = factory[DEP_LIST_PROP_NAME]
        depList && depList.forEach((key) => deps[key] = container.get(key))

        const newInstance = factory(deps)
        instances[key] = newInstance
        return newInstance
      },

      child(context) {
        // TODO check context !== global
        return _createContainer({
          context,
          parent: container,
          factories: {},
        })
      },
    }
    return container
  }

  function createGlobalContainer() {
    return _createContainer({
      context: "global",
      parent: undefined,
      factories: {},
    })
  }

  function inject(depList) {
    return (component) => {
      component[DEP_LIST_PROP_NAME] = depList
      return component
    }
  }

  return {
    createContainer: createGlobalContainer,
    inject,
  }
}
