
module.exports = {
  createModule,
  getSubModule,

  formatModulePath,
  parseModulePath,

  splitModulePath,
  joinModulePath,

  isPathEqual,
}

function createModule(modulePath = []) {
  const mod = {
    modulePath,
    instances: {},
    factories: {},
    modules: {},
  }
  return  mod
}

function getSubModule(modulePath, currentModule) {
  let targetModule = currentModule
  modulePath.forEach((modId) => {
    targetModule = targetModule.modules[modId]
  })
  return targetModule
}

function formatModulePath(modPath) {
  return modPath.join(".")
}

function parseModulePath(formattedModulePath) {
  return formattedModulePath.split(".")
}

function joinModulePath(modulePath, componentId) {
  return [...modulePath, componentId]
}

function splitModulePath(fullComponentPath) {
  const parentModule = fullComponentPath.slice(0, -1)
  const componentId = fullComponentPath[fullComponentPath.length - 1]
  return {parentModule, componentId}
}

function isPathEqual(modulePath1, modulePath2) {
  return formatModulePath(modulePath1) === formatModulePath(modulePath2)
}
