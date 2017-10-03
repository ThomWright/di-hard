const {
  getComponent,
  splitModulePath,
  getLowestCommonAncester,
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
}

function forRootModule(rootModule) {
  return (fromPath) => (testPath) => {
    const {
      parentModulePath: ownerModulePath,
    } = splitModulePath(fromPath)

    const commonAncestorPath = getLowestCommonAncester(fromPath, testPath)
    const commonAncestor = getComponent(rootModule, commonAncestorPath)

    let offset = commonAncestorPath.length
    let testComponent = getComponent(commonAncestor, [testPath[offset++]])

    if (sameModulePath(commonAncestorPath, ownerModulePath)) {
      // we can see private components in the same module
      testComponent = getComponent(testComponent, [testPath[offset++]])
    }

    while (testComponent !== undefined) {
      if (testComponent.visibility === visibilities.PRIVATE) {
        return false
      }
      testComponent = getComponent(testComponent, [testPath[offset++]])
    }

    return  true
  }
}

function makePrivate(component) {
  return Object.assign({}, component, {visibility: visibilities.PRIVATE})
}
function makePublic(component) {
  return Object.assign({}, component, {visibility: visibilities.PUBLIC})
}
