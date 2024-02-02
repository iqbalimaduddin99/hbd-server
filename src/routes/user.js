const express = require("express");
const { body } = require("express-validator");
const router = express.Router();
const cron = require('node-cron');

const userController = require("../controller/user");
const authController = require("../controller/auth");
const { auth } = require("../middleware/auth");


router.get("/authorization", auth, authController.checkAuth);
router.post(
  "/create", 
  [
    body("first_name").not().isEmpty().withMessage("First Name is Required"),
    body("last_name").not().isEmpty().withMessage("Last Name is Required"),
    body("birthday").not().isEmpty().withMessage("Birthday is Required"),
    body("location").not().isEmpty().withMessage("Location is Required"),
    body("email", 'Invalid email').isEmail(),
    body("password").not().isEmpty().withMessage("Password is Required"),
  ],
  userController.createUser
);

router.put("/update/:id", auth, userController.updateUser);
router.get("/get/:id", auth, userController.findUserById);


router.delete("/delete/:id", auth, userController.deleteUser);

router.post(
  "/login",
  [
    body("email").not().isEmpty().withMessage("Email is Required"),
    body("password").not().isEmpty().withMessage("Password is Required"),
  ],
  userController.loginUser
);

router.get("/getcroncoba", userController.cronBirthdayScheduler);


const today = new Date();
const month = today.getMonth() + 1;
const date = today.getDate();

cron.schedule(`03 0 ${date} ${month} *`, () => {
  userController.cronBirthdayScheduler(month, date)
});

module.exports = router;
