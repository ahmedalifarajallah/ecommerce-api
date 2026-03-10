const mongoose = require("mongoose");

exports.withTransaction = async function (fn) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const result = await fn(session);
    await session.commitTransaction();
    session.endSession();
    return result;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};
