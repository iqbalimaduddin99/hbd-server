
const { User } = require("../../models");

const jwt = require("jsonwebtoken");

exports.auth = (req, res, next) => {
  try {
    let header = req.header("Authorization");

    if (!header) {
      return res.send({
        status: "failed",
        message: "Unauthorized",
      });
    }

    const token = header.replace("Bearer ", "");

    const secretKey = process.env.secretKey;

    const verified = jwt.verify(token, secretKey);

    req.idUser = verified;

    next();
  } catch (error) {
    console.log(error);
    res.status({
      status: "failed",
      message: "Server Error",
    });
  }
};