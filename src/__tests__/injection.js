const test = require("ava")

const createContainerModule = require("../container")

const NOOP_STREAM = {write: () => {}}
const {createContainer} = createContainerModule({stdio: NOOP_STREAM})

test("single dependency", t => {
  const componentDefinition = ({dependency}) => {
    return {
      getInjectedDependency() {
        return dependency
      },
    }
  }

  const dependencyDefinition = () => "dependencyInstance"

  const container = createContainer("root")
  container.register("testComponent", componentDefinition)
  container.register("dependency", dependencyDefinition)

  const instance = container.resolve("testComponent")
  const dep = instance.getInjectedDependency()
  t.is(dep, "dependencyInstance", "should inject an instance of the requested dependency")
})

test("unknown dependency key", t => {
  const componentDefinition = ({dependencyName}) => {
    return {
      getInjectedDependency() {
        return dependencyName
      },
    }
  }

  const container = createContainer("root")
  container.register("testComponent", componentDefinition)

  const error = t.throws(
    () => container.resolve("testComponent"),
    Error
  )
  t.regex(error.message, /dependencyName/, "should specify unknown key")
})
