const jwt = require("jsonwebtoken");
const { User } = require("../model/model.js");

const verifyJwt = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
   console.log("aurh header", authHeader)
   
    const token =
      (authHeader?.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null) ||
      req.cookies?.["admin-token"] ||
      req.cookies?.["institution-token"];

     console.log("token, ", token)

    if (!token) {
      return res.status(401).json({ message: "Unauthorized request" });
    }

    console.log('==>' , token)


    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);


    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({ message: "Invalid token" });
    }


    req.user = user;
    req.userRole = user.role;

    next();
  } catch (error) {
    console.error("JWT error:", error.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = verifyJwt;
