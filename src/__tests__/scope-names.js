const test = require("ava")

const createContainerModule = require("../container")

const NOOP_STREAM = {write: () => {}}
const {createContainer} = createContainerModule({stdio: NOOP_STREAM})

test("createContainer()", t => {
  t.throws(
    () => createContainer(),
    Error,
    "should throw when creating a container with out a name"
  )
})

test("child()", t => {
  const container = createContainer("name")
  t.throws(
    () => container.child(),
    Error,
    "should throw when creating a child container without a name"
  )
})
