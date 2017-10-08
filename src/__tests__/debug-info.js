const test = require("ava")

const createContainerModule = require("../container")
const lifetimes = require("../lifetimes")
const {TRANSIENT, REGISTRATION} = lifetimes

const NOOP_STREAM = {write: () => {}}
const {createContainer} = createContainerModule({stdio: NOOP_STREAM})

test("listing registrations and their dependencies", t => {
  const parent = createContainer("parent")
  parent.registerFactory("A", ({B}) => B, {lifetime: REGISTRATION})
  parent.registerFactory("B", ({}) => {})

  const child = parent.child("child")
  child.registerFactory("C", ({A}) => A)
  child.registerFactory("D", ({E}) => E)

  child.registerValue("E", "e")

  child.registerSubmodule("M")
    .registerValue("MV", "mv")
    .registerSubmodule("N")

  const tree = child.getDebugInfo()

  t.deepEqual(tree, {
    name: "child",
    module: {
      modulePath: "",
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
      modules: {
        M: {
          modulePath: "M",
          factories: {},
          instances: ["MV"],
          modules: {
            N: {
              modulePath: "M.N",
              factories: {},
              instances: [],
              modules: {},
            },
          },
        },
      },
    },
    parentContainer: {
      name: "parent",
      module: {
        modulePath: "",
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
        modules: {},
      },
    },
  })
})
