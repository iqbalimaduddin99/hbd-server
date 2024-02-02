const { users } = require("../../models");

exports.checkAuth = async (req, res) => {
  try {
    const { id } = req.idUser

    const checkUser = await users.findOneById(id);

    if (!checkUser) {
      return res.send({
        status: "failed",
        message: "You are not login, please login",
      });
    }

    res.send({
      status: "success",
      data: checkUser,
    });
  } catch (error) {
    console.log(error);
    res.status({
      status: "failed",
      message: "Server Error",
    });
  }
};
