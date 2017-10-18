import {
  ModuleRegistration,
  getRegistration,
  getParentPath,
  isPathEqual as sameModulePath,
} from "./modules"

import {ModulePath} from "./modules"

enum Visibility {
  Public = "Public",
  Private = "Private",
}

export default Visibility

export function forRootModule(rootModuleReg: ModuleRegistration) {
  return (fromPath: ModulePath) => (testPath: ModulePath) => {
    const parentModulePath = getParentPath(fromPath)

    let isCommonAncestor = true
    for (let i = 0; i < testPath.length; i++) {
      const currentTestPath = take(i + 1, testPath)

      if (sameModulePath(parentModulePath, getParentPath(currentTestPath))) {
        // we can see things in the same module, even if they're private
        continue
      }

      if (testPath[i] !== fromPath[i]) {
        isCommonAncestor = false
      }
      if (isCommonAncestor) {
        // we can see common ancestors, even if they're private
        continue
      }

      const testComponentReg = getRegistration(rootModuleReg, currentTestPath)
      if (!testComponentReg) {
        throw new Error(`Could not deduce visibility for '${currentTestPath}'`)
      }

      if (testComponentReg.visibility === Visibility.Private) {
        return false
      }
    }

    return true
  }
}

function take<T>(n: number, array: T[]): T[] {
  return array.slice(0, n < 0 ? Infinity : n)
}
