
// Do whatever you want with this, it shouldn't throw any Errors
const superDooperErrorSuppressor = new Proxy(() => superDooperErrorSuppressor, {
  get: () => superDooperErrorSuppressor,
})

module.exports = function getDebugInfo({
  containerName,
  parentContainer,
  instances,
  factories,
}) {
  const info = {
    name: containerName,
    factories: {},
    instances: Object.keys(instances),
  }
  Object.keys(factories)
    .forEach((id) => {
      const registration = factories[id]
      info.factories[id] = {
        lifetime: registration.lifetime,
        dependencies: [],
      }
      registration.factory(new Proxy({}, {
        get(target, propertyName) {
          info
            .factories[id]
            .dependencies
            .push(propertyName)
          return superDooperErrorSuppressor
        },
      }))
    })
  if (parentContainer) {
    info.parentContainer = parentContainer.getDebugInfo()
  }
  return info
}
