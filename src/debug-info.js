
// Do whatever you want with this, it shouldn't throw any Errors
const superDooperErrorSuppressor = new Proxy(() => superDooperErrorSuppressor, {
  get: () => superDooperErrorSuppressor,
})

module.exports = function getDebugInfo({
  containerName,
  parentContainer,
  rootModule,
}) {
  const info = {
    name: containerName,
    module: getModuleDebugInfo(rootModule),
  }

  if (parentContainer) {
    info.parentContainer = parentContainer.getDebugInfo()
  }
  return info
}

function getModuleDebugInfo(mod) {
  const modInfo = {
    instances: Object.keys(mod.instances),
    factories: {},
  }
  Object.keys(mod.factories)
    .forEach((id) => {
      const registration = mod.factories[id]
      modInfo.factories[id] = {
        lifetime: registration.lifetime,
        dependencies: [],
      }
      registration.factory(new Proxy({}, {
        get(target, propertyName) {
          modInfo
            .factories[id]
            .dependencies
            .push(propertyName)
          return superDooperErrorSuppressor
        },
      }))
    })

  return modInfo
}
