const test = require("ava")

const createContainerModule = require("../container")

const NOOP_STREAM = {write: () => {}}
const {createContainer} = createContainerModule({stdio: NOOP_STREAM})

test("create", t => {
  const container = createContainer("root")
  t.is(typeof container, "object", "should create an object")
})

test("creating without a name", t => {
  const error = t.throws(
    () => createContainer(),
    Error,
    "should throw when creating a container without a name"
  )
  t.regex(error.message, /name/)
})
