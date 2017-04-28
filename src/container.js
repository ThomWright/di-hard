
module.exports = {
  createContainer,
}

function createContainer() {
  const factories = {}
  return {
    register(key, factory) {
      factories[key] = factory
    },
    get(key) {
      return factories[key]()
    },
  }
}
