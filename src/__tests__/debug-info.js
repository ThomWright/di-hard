const test = require("ava")

const createContainerModule = require("../container")
const lifetimes = require("../lifetimes")
const {TRANSIENT, REGISTRATION} = lifetimes

const NOOP_STREAM = {write: () => {}}
const {createContainer} = createContainerModule({stdio: NOOP_STREAM})

test("listing registrations and their dependencies", t => {
  const parent = createContainer("root")
  parent.registerFactory("A", ({B}) => B, REGISTRATION)
  parent.registerFactory("B", ({}) => {})

  const child = parent.child("child")
  child.registerFactory("C", ({A}) => A)
  child.registerFactory("D", ({E}) => E)

  child.registerValue("E", "e")

  const tree = child.getDebugInfo()

  t.deepEqual(tree, {
    name: "child",
    rootModule: {
      factories: {
        C: {
          lifetime: TRANSIENT,
          dependencies: ["A"],
        },
        D: {
          lifetime: TRANSIENT,
          dependencies: ["E"],
        },
      },
      instances: ["E"],
    },
    parentContainer: {
      name: "root",
      rootModule: {
        factories: {
          A: {
            lifetime: REGISTRATION,
            dependencies: ["B"],
          },
          B: {
            lifetime: TRANSIENT,
            dependencies: [],
          },
        },
        instances: [],
      },
    },
  })
})
