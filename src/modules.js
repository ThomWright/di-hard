
const ROOT_MODULE_PATH = []

// TODO could use symbols to really hide the internal structure?
const INSTANCES_PROP = "instances"
const FACTORIES_PROP = "factories"
const MODULES_PROP = "modules"

const getInstance = get(INSTANCES_PROP)
const getFactory = get(FACTORIES_PROP)
const getModule = get(MODULES_PROP)

module.exports = {
  createModule,

  createRegistrationApi,
  cacheInstance,

  getSubModule,
  getComponent,
  getInstance,
  getFactory,
  getModule,
  exists,

  getModulePath,
  formatModulePath,
  parseModulePath,
  splitModulePath,
  getParentPath,
  joinModulePath,
  isPathEqual,
}

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
  if (modulePath.length === 0) {
    return currentModule
  }
  let targetModule = currentModule
  modulePath.forEach((modId) => {
    targetModule = getModule(targetModule, modId)
  })
  return targetModule
}

function getComponent(currentModule, modulePath) {
  if (modulePath.length === 0) {
    return currentModule
  }
  const {parentModulePath, componentId} = splitModulePath(modulePath)
  let parentModule = currentModule
  parentModulePath.forEach((modId) => {
    parentModule = getModule(parentModule, modId)
  })
  return (
    getModule(parentModule, componentId)
    || getFactory(parentModule, componentId)
    || getInstance(parentModule, componentId)
  )
}

function exists(mod, id) {
  return !!(getModule(mod, id)
  || getFactory(mod, id)
  || getInstance(mod, id))
}

function get(type) {
  return (mod, id) => mod[type] && mod[type][id]
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

function joinModulePath(modulePath, rest) {
  if (Array.isArray(rest)) {
    return [...modulePath, ...rest]
  }
  return [...modulePath, rest]
}

function splitModulePath(fullComponentPath) {
  const parentModulePath = getParentPath(fullComponentPath)
  const componentId = fullComponentPath[fullComponentPath.length - 1]
  return {parentModulePath, componentId}
}

function getParentPath(fullComponentPath) {
  return fullComponentPath.slice(0, -1)
}

function isPathEqual(modulePath1, modulePath2) {
  return formatModulePath(modulePath1) === formatModulePath(modulePath2)
}
