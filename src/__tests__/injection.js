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
  container.registerFactory("testComponent", componentDefinition)
  container.registerFactory("dependency", dependencyDefinition)

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
  container.registerFactory("testComponent", componentDefinition)

  const error = t.throws(
    () => container.resolve("testComponent"),
    Error
  )
  t.regex(error.message, /dependencyName/, "should specify unknown key")
})


test("between submodules", t => {
  const componentDefinition = ({
    submodule: {
      dependency,
    },
  }) => {
    return {
      getInjectedDependency() {
        return dependency
      },
    }
  }

  const dependencyDefinition = () => "dependencyInstance"

  const container = createContainer("root")
  container
    .registerSubmodule("submodule")
      .registerFactory("testComponent", componentDefinition)
      .registerFactory("dependency", dependencyDefinition)

  const instance = container.resolve("submodule.testComponent")
  const dep = instance.getInjectedDependency()
  t.is(dep, "dependencyInstance", "should inject an instance of the requested dependency from the specified submodule")
})
