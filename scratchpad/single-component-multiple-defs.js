const {define, alias} = require("@mft/di")

module.exports.yodleeThing = define({
  key: "yodlee-updater",
  inject: ["logger", alias("yodlee-provider").as("provider")],
  factory: updaterFactory,
})

module.exports.monzoThing = define({
  key: "monzo-updater",
  inject: ["logger", alias("monzo-provider").as("provider")],
  factory: updaterFactory,
})

// generic updater
function updaterFactory({logger, provider}) {
  return {
    update() {
      provider.update()
        .catch((e) => {
          logger.error(e)
        })
    },
  }
}
