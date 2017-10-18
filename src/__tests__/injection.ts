import test from "ava"

import createContainerModule from "../container"
import Visibility from "../visibility"
import Lifetime from "../lifetimes"

const {createContainer} = createContainerModule()

test("single dependency", t => {
  const componentDefinition = ({dependency}: {dependency: string}) => {
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
  t.is(
    dep,
    "dependencyInstance",
    "should inject an instance of the requested dependency",
  )
})

test("unknown dependency key", t => {
  const componentDefinition = ({dependencyName}: {dependencyName: string}) => {
    return {
      getInjectedDependency() {
        return dependencyName
      },
    }
  }

  const container = createContainer("root")
  container.registerFactory("testComponent", componentDefinition)

  const error = t.throws(() => container.resolve("testComponent"), Error)
  t.regex(error.message, /dependencyName/, "should specify unknown key")
})

test("public component in same module", t => {
  const componentDefinition = ({
    submodule: {dependency},
  }: {
    submodule: {dependency: string}
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
    .registerSubmodule("submodule", {visibility: Visibility.Public})
    .registerFactory("testComponent", componentDefinition, {
      lifetime: Lifetime.Transient,
      visibility: Visibility.Public,
    })
    .registerFactory("dependency", dependencyDefinition, {
      lifetime: Lifetime.Transient,
      visibility: Visibility.Public,
    })

  const instance = container.resolve("submodule.testComponent")
  const dep = instance.getInjectedDependency()
  t.is(
    dep,
    "dependencyInstance",
    "should inject a dependency from the same submodule",
  )
})

test("private component in same submodule", t => {
  const componentDefinition = ({
    submodule: {dependency},
  }: {
    submodule: {dependency: string}
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
    .registerSubmodule("submodule", {visibility: Visibility.Public})
    .registerFactory("testComponent", componentDefinition, {
      lifetime: Lifetime.Transient,
      visibility: Visibility.Public,
    })
    .registerFactory("dependency", dependencyDefinition)

  const instance = container.resolve("submodule.testComponent")
  const dep = instance.getInjectedDependency()
  t.is(
    dep,
    "dependencyInstance",
    "should inject a dependency from the same submodule",
  )
})
