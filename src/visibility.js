const {
  getComponent,
  getParentPath,
  isPathEqual: sameModulePath,
} = require("./modules")

const visibilityNames = ["PUBLIC", "PRIVATE"]
const visibilities = new Proxy({},
  {
    get(target, name) {
      if (!visibilityNames.includes(name)) {
        throw new Error(`'${name}' is not a valid visibility. Valid keys: ${visibilityNames.join(", ")}`)
      }
      return name
    },
  }
)

module.exports = {
  visibilities,
  forRootModule,
  makePublic,
  makePrivate,
  addVisibility,
}

function forRootModule(rootModule) {
  return (fromPath) => (testPath) => {
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

      const testComponent = getComponent(rootModule, currentTestPath)
      if (testComponent.visibility === visibilities.PRIVATE) {
        return false
      }
    }

    return true
  }
}

function take(n, array) {
  return array.slice(0, n < 0 ? Infinity : n)
}

function addVisibility(visibility, component) {
  switch (visibility) {
  case visibilities.PUBLIC:
    return makePublic(component)
  case visibilities.PRIVATE:
    return makePrivate(component)
  default:
    throw new Error(`'${visibility}' isn't a real visibility mate`)
  }
}

function makePrivate(component) {
  return Object.assign({}, component, {visibility: visibilities.PRIVATE})
}
function makePublic(component) {
  return Object.assign({}, component, {visibility: visibilities.PUBLIC})
}
