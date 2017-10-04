const test = require("ava")

const createContainerModule = require("../container")
const {visibilities} = require("../visibility")
const lifetimes = require("../lifetimes")

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

test("public component in same module", t => {
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
    .registerSubmodule("submodule", visibilities.PUBLIC)
      .registerFactory("testComponent", componentDefinition, lifetimes.TRANSIENT, visibilities.PUBLIC)
      .registerFactory("dependency", dependencyDefinition, lifetimes.TRANSIENT, visibilities.PUBLIC)

  const instance = container.resolve("submodule.testComponent")
  const dep = instance.getInjectedDependency()
  t.is(dep, "dependencyInstance", "should inject a dependency from the same submodule")
})

test("private component in same submodule", t => {
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
    .registerSubmodule("submodule", visibilities.PUBLIC)
      .registerFactory("testComponent", componentDefinition, lifetimes.TRANSIENT, visibilities.PUBLIC)
      .registerFactory("dependency", dependencyDefinition)

  const instance = container.resolve("submodule.testComponent")
  const dep = instance.getInjectedDependency()
  t.is(dep, "dependencyInstance", "should inject a dependency from the same submodule")
})
