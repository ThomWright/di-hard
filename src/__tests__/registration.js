const test = require("ava")

const createContainerModule = require("../container")

const NOOP_STREAM = {write: () => {}}
const {createContainer} = createContainerModule({stdio: NOOP_STREAM})

test("factory - valid", t => {
  const componentDefinition = () => "testComponentInstance"

  const container = createContainer("root")
  t.notThrows(
    () => container.registerFactory("testComponent", componentDefinition),
    "should accept a factory function registration"
  )
})

test("factory - single argument", t => {
  const container = createContainer("root")

  const error = t.throws(
    () => container.registerFactory("myID"),
    Error
  )
  t.regex(error.message, /myID/)
})

test("factory - invalid ID", t => {
  const container = createContainer("root")

  function myFactory() {}

  const error = t.throws(
    () => container.registerFactory({}, myFactory),
    Error
  )
  t.regex(error.message, /string/i)
})

test("factory - invalid (not a function)", t => {
  const container = createContainer("root")
  const error = t.throws(
    () => container.registerFactory("testComponent", "not a function"),
    Error,
    "should not accept factories that are not functions"
  )

  t.regex(error.message, /testComponent/)
  t.regex(error.message, /not a function/)
})

test("factory - same name twice", t => {
  const componentDefinition = () => "testComponentInstance"

  const container = createContainer("root")
  container.registerFactory("uniqueId", componentDefinition)

  const error = t.throws(
    () => container.registerFactory("uniqueId", componentDefinition),
    Error,
    "should error with warning about repeated registration"
  )

  t.regex(error.message, /uniqueId/, "should specify the problem ID")
})

test("value", t => {
  const container = createContainer("root")
  container.registerValue("myValue", "theValue")
  const val = container.resolve("myValue")
  t.is(val, "theValue")
})

test("value - undefined", t => {
  const container = createContainer("root")
  t.notThrows(
    () => container.registerValue("myValue", undefined),
    "should accept undefined as a value"
  )
  const val = container.resolve("myValue")
  t.is(val, undefined)
})

test("value - single argument", t => {
  const container = createContainer("root")

  const error = t.throws(
    () => container.registerValue("myID"),
    Error,
    "should throw when value not supplied"
  )
  t.regex(error.message, /myID/)
})

test("value - invalid ID", t => {
  const container = createContainer("root")

  const error = t.throws(
    () => container.registerValue({}, "value"),
    Error
  )
  t.regex(error.message, /string/i)
})

test("value - with same name as factory", t => {
  const container = createContainer("root")
  container.registerFactory("uniqueId", () => {})

  const error = t.throws(
    () => container.registerValue("uniqueId", "value"),
    Error,
    "should not be able to reuse IDs"
  )

  t.regex(error.message, /uniqueId/, "should specify the problem ID")
})

test("factory - with same name as value", t => {
  const container = createContainer("root")
  container.registerValue("uniqueId", "value")

  const error = t.throws(
    () => container.registerFactory("uniqueId", () => {}),
    Error,
    "should not be able to reuse IDs"
  )

  t.regex(error.message, /uniqueId/, "should specify the problem ID")
})

test("factory - with same name as submodule", t => {
  const container = createContainer("root")
  container.registerSubmodule("uniqueId", "value")

  const error = t.throws(
    () => container.registerFactory("uniqueId", () => {}),
    Error,
    "should not be able to reuse IDs"
  )

  t.regex(error.message, /uniqueId/, "should specify the problem ID")
})

test("factory - with same name as value of 'undefined'", t => {
  const container = createContainer("root")
  container.registerValue("uniqueId", undefined)

  const error = t.throws(
    () => container.registerFactory("uniqueId", () => {}),
    Error,
    "should not be able to reuse IDs, even if value is falsy"
  )

  t.regex(error.message, /uniqueId/, "should specify the problem ID")
})

test("chaining", t => {
  t.notThrows(
    () => createContainer("root")
      .registerFactory("f", () => {})
      .registerValue("a", "a")
      .registerSubmodule("m")
      .registerValue("b", "b"),
    "should not throw when chaining registations"
  )
})

test("submodule", t => {
  const container = createContainer("container-with-submodule")

  t.notThrows(
    () => container.registerSubmodule("submodule"),
    "should accept a submodule registration"
  )
})

test("submodule - with same name as factory", t => {
  const container = createContainer("root")
  container.registerSubmodule("uniqueId", "value")

  const error = t.throws(
    () => container.registerFactory("uniqueId", () => {}),
    Error,
    "should not be able to reuse IDs"
  )

  t.regex(error.message, /uniqueId/, "should specify the problem ID")
})

test("submodule - with same name as value", t => {
  const container = createContainer("root")
  container.registerSubmodule("uniqueId", "value")

  const error = t.throws(
    () => container.registerValue("uniqueId", () => {}),
    Error,
    "should not be able to reuse IDs"
  )

  t.regex(error.message, /uniqueId/, "should specify the problem ID")
})

test("submodule - value within a submodule", t => {
  const container = createContainer("container-with-submodule")

  container
    .registerSubmodule("submodule")
      .registerValue("valueId", "some-value")

  const error = t.throws(
    () => container.resolve("valueId"),
    Error,
    "values registered in a submodule should not be resolvable at the top level"
  )

  t.regex(error.message, /Nothing registered/, "should state the problem")
  t.regex(error.message, /valueId/, "should specify the problem ID")
})
