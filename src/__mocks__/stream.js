
module.exports = function createStreamMock(sinon) {
  const writeSpy = sinon.spy()
  const streamMock = {
    write: writeSpy,
  }

  return {
    streamMock,
    writeSpy,
  }
}
