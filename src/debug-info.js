const {formatModulePath} = require("./modules")

// Do whatever you want with this, it shouldn't throw any Errors
const superDooperErrorSuppressor = new Proxy(() => superDooperErrorSuppressor, {
  get: (target, property) => {
    if (property === Symbol.toPrimitive) {
      // convert to primitive for e.g. console.log
      return () => "superDooperErrorSuppressor"
    }
    return superDooperErrorSuppressor
  },
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
module.exports.getModuleDebugInfo = getModuleDebugInfo

function getModuleDebugInfo(mod) {
  const modInfo = {
    modulePath: formatModulePath(mod.modulePath),
    instances: Object.keys(mod.instances),
    factories: {},
    modules: {},
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
  Object.keys(mod.modules)
    .forEach((id) => {
      modInfo.modules[id] = getModuleDebugInfo(mod.modules[id])
    })

  return modInfo
}
