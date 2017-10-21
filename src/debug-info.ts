import {ContainerInternalApi} from "./container"
import {Id, ModuleRegistration, Instance, formatModulePath} from "./modules"
import Lifetime from "./lifetimes"

export interface DebugInfo {
  name: string
  module: ModuleDebugInfo
  parentContainer?: DebugInfo
}

export interface ModuleDebugInfo {
  modulePath: string
  instances: Id[]
  factories: Record<Id, FactoryDebugInfo>
  modules: Record<Id, ModuleDebugInfo>
}

export interface FactoryDebugInfo {
  lifetime: Lifetime
  dependencies: Id[]
}

// Do whatever you want with this, it shouldn't throw any Errors
const superDooperErrorSuppressor: Instance = new Proxy(
  () => superDooperErrorSuppressor,
  {
    get: (target, property) => {
      if (property === Symbol.toPrimitive) {
        // convert to primitive for e.g. console.log
        return () => "superDooperErrorSuppressor"
      }
      return superDooperErrorSuppressor
    },
  },
)

export default function getDebugInfo({
  containerName,
  parentContainer,
  rootModuleReg,
}: {
  containerName: string
  parentContainer: ContainerInternalApi | undefined
  rootModuleReg: ModuleRegistration
}) {
  const info: DebugInfo = {
    name: containerName,
    module: getModuleDebugInfo(rootModuleReg),
  }

  if (parentContainer) {
    info.parentContainer = parentContainer.getDebugInfo()
  }
  return info
}
module.exports.getModuleDebugInfo = getModuleDebugInfo

function getModuleDebugInfo(modReg: ModuleRegistration): ModuleDebugInfo {
  const mod = modReg.module
  const modInfo: ModuleDebugInfo = {
    modulePath: formatModulePath(modReg.modulePath),
    instances: Object.keys(mod.instances),
    factories: {},
    modules: {},
  }
  Object.keys(mod.factories).forEach(id => {
    const registration = mod.factories[id]
    if (!registration) {
      return
    }
    modInfo.factories[id] = {
      lifetime: registration.lifetime,
      dependencies: [],
    }
    registration.factory(
      new Proxy(
        {},
        {
          get(target, propertyName) {
            modInfo.factories[id].dependencies.push(propertyName.toString())
            return superDooperErrorSuppressor
          },
        },
      ),
    )
  })
  Object.keys(mod.modules).forEach(id => {
    const registration = mod.modules[id]
    if (!registration) {
      return
    }
    modInfo.modules[id] = getModuleDebugInfo(registration)
  })

  return modInfo
}
