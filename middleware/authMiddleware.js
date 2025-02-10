// const jwt = require("jsonwebtoken");

// const protect = (req, res, next) => {
//   const token = req.header("Authorization");
//   if (!token) return res.status(401).json({ message: "No token, authorization denied" });

//    // "Bearer token" add auto directly token for auth
//    if (token.startsWith("Bearer ")) {
//     token = token.slice(7, token.length); 
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = decoded;
//     next();
//   } catch (err) {
//     res.status(401).json({ message: "Token is not valid" });
//   }
// };

// const adminOnly = (req, res, next) => {
//   if (req.user.role !== "admin") return res.status(403).json({ message: "Access Denied" });
//   next();
// };


// module.exports = { protect, adminOnly };


// exports.authMiddleware = (req, res, next) => {
//   const token = req.header("Authorization");
//   if (!token) return res.status(401).json({ message: "Unauthorized" });
//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = decoded;
//     next();
//   } catch (error) {
//     res.status(401).json({ message: "Invalid token" });
//   }
// };



const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  let token = req.header("Authorization");
  if (!token) return res.status(401).json({ message: "No token, authorization denied" });

  if (token.startsWith("Bearer ")) {
    token = token.slice(7, token.length);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Token is not valid" });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Access Denied" });
  next();
};

module.exports = { protect, adminOnly };
