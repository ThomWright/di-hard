const test = require("ava")

const createContainerModule = require("../container")

const NOOP_STREAM = {write: () => {}}
const {createContainer} = createContainerModule({stdio: NOOP_STREAM})

test("valid factory", t => {
  const componentDefinition = () => "testComponentInstance"

  const container = createContainer("root")
  t.notThrows(
    () => container.registerFactory("testComponent", componentDefinition),
    "should accept a factory function registration"
  )
})

test("invalid factory (not a function)", t => {
  const container = createContainer("root")
  const error = t.throws(
    () => container.registerFactory("testComponent", "not a function"),
    Error,
    "should not accept factories that are not functions"
  )

  t.regex(error.message, /testComponent/)
  t.regex(error.message, /not a function/)
})

test("same name twice", t => {
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

test("values", t => {
  const container = createContainer("root")
  container.registerValue("myValue", "theValue")
  const val = container.resolve("myValue")
  t.is(val, "theValue")
})

test("value with same name as factory", t => {
  const container = createContainer("root")
  container.registerFactory("uniqueId", () => {})

  const error = t.throws(
    () => container.registerValue("uniqueId", "value"),
    Error,
    "should not be able to reuse IDs"
  )

  t.regex(error.message, /uniqueId/, "should specify the problem ID")
})

test("factory with same name as value", t => {
  const container = createContainer("root")
  container.registerValue("uniqueId", "value")

  const error = t.throws(
    () => container.registerFactory("uniqueId", () => {}),
    Error,
    "should not be able to reuse IDs"
  )

  t.regex(error.message, /uniqueId/, "should specify the problem ID")
})

test("factory with same name as value of 'undefined'", t => {
  const container = createContainer("root")
  container.registerValue("uniqueId", undefined)

  const error = t.throws(
    () => container.registerFactory("uniqueId", () => {}),
    Error,
    "should not be able to reuse IDs, even if value is falsy"
  )

  t.regex(error.message, /uniqueId/, "should specify the problem ID")
})
