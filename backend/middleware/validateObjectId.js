// backend/middleware/validateObjectId.js
// NO IMPORT NEEDED — mongoose is global in Node ESM

const validateObjectId = (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ msg: "Invalid ID format" });
  }
  next();
};

export default validateObjectId;