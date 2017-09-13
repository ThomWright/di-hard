
const INSTANCES_PROP = "instances"
const FACTORIES_PROP = "factories"
const MODULES_PROP = "modules"

module.exports = {
  createModule,
  getSubModule,
  createRegistrationApi,
  cacheInstance,

  getInstance: get(INSTANCES_PROP),
  getFactory: get(FACTORIES_PROP),
  getModule: get(MODULES_PROP),

  getModulePath,

  formatModulePath,
  parseModulePath,

  splitModulePath,
  joinModulePath,

  isPathEqual,
}

const ROOT_MODULE_PATH = []

function createModule() {
  const mod = {
    modulePath: ROOT_MODULE_PATH,
    [INSTANCES_PROP]: {},
    [FACTORIES_PROP]: {},
    [MODULES_PROP]: {},
  }
  return  mod
}

function getModulePath(mod) {
  return mod.modulePath
}

function getSubModule(currentModule, modulePath) {
  let targetModule = currentModule
  modulePath.forEach((modId) => {
    targetModule = targetModule[MODULES_PROP][modId]
  })
  return targetModule
}

function get(type) {
  return (mod, id) => mod[type][id]
}

function createRegistrationApi(rootModule) {
  function forContext(moduleContext) {
    const currentModule = getSubModule(rootModule, moduleContext)
    return {
      registerFactory: registerForComponentType(FACTORIES_PROP)(currentModule),
      registerInstance: registerForComponentType(INSTANCES_PROP)(currentModule),
      registerModule: registerForComponentType(MODULES_PROP)(currentModule),
      forSubModule: (id) => forContext(joinModulePath(moduleContext, id)),
    }
  }
  return forContext(ROOT_MODULE_PATH)
}

function registerForComponentType(type) {
  return (currentModule) => (componentId, componentRegistration) => {
    checkAvailability(currentModule, componentId)
    currentModule[type][componentId] = Object.assign(
      {},
      componentRegistration,
      {modulePath: joinModulePath(currentModule.modulePath, componentId)}
    )
  }
}

function checkAvailability(mod, id) {
  if (mod[FACTORIES_PROP].hasOwnProperty(id)) {
    throw new Error(`Cannot register '${id}' - already registered as a factory`)
  }
  if (mod[INSTANCES_PROP].hasOwnProperty(id)) {
    throw new Error(`Cannot register '${id}' - already registered as a value`)
  }
  if (mod[MODULES_PROP].hasOwnProperty(id)) {
    throw new Error(`Cannot register '${id}' - already registered as a submodule`)
  }
  if (typeof id !== "string") {
    throw new Error(`Cannot register '${id}' - ID must be a string`)
  }
  if (!/^\w*$/.test(id)) {
    throw new Error(`Cannot register '${id}' - invalid characters. Allowed characters: 'a-z', 'A-Z', '0-9' and '_'`)
  }
}

function cacheInstance(mod, id, instanceRegistration) {
  mod[INSTANCES_PROP][id] = Object.assign(
    {},
    instanceRegistration,
    {modulePath: joinModulePath(mod.modulePath, id)}
  )
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
  const parentModulePath = fullComponentPath.slice(0, -1)
  const componentId = fullComponentPath[fullComponentPath.length - 1]
  return {parentModulePath, componentId}
}

function isPathEqual(modulePath1, modulePath2) {
  return formatModulePath(modulePath1) === formatModulePath(modulePath2)
}
