const { users, birthday_messages } = require("../../models");
const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { Op } = require("sequelize");
const axios = require("axios");
const db = require("../../models");

const instance = axios.create({
  timeout: 5000,
});

// Things to consider. You can do it after all program running well
// • Make sure your code is scalable and has a good level of abstraction. For example, in
// the future we may want to add a happy anniversary message as well.
// • Make sure your code is tested and testable
// • Be mindful of race conditions, duplicate messages are unacceptable
// • Think about scalability (with the limits of localhost), will the system be able to handle
// thousands of birthdays a day?

// Make the birtday using local time

// Make the race condition beetween cron and interval from FE
exports.cronBirthdayScheduler = async (req, res) => {
  try {
    const today = new Date();
    const month = today.getMonth() + 1;
    const date = today.getDate();

    console.log("date", date);
    console.log("month", month);

    const usersGet = await users.findAllByBirthdayTodayLockTrue(month, date);
    const birthdayGet =
      await birthday_messages.findAllBirthdayBySendToServerNotToday();

    console.log("usersGet", usersGet);

    usersGet.forEach(async (user) => {
      try {
        let d = new Date();
        d = new Date(`${d.getFullYear()}-${user.month}-${user.date}`);
        // it must left join birtday this year and rellevant birthday
        const checkMessage =
          await birthday_messages.findBirtdayByUserIdAndBirthday(user.id, d);

        let bodyBirthday = {
          user_id: user.id,
          sentToService: false,
          birthday_now: d,
          sentToUser: false,
          relevant: true,
          message: `Hey, ${user.first_name} ${user.last_name}  it's your birthday`,
        };

        let birthDayGet = undefined;
        if (!checkMessage) {
          birthDayGet = await birthday_messages.create(bodyBirthday);
        } else {
          birthDayGet = checkMessage;
        }

        const response = await axios.post(
          "https://email-service.digitalenvision.com.au/send-email",
          {
            email: user.email,
            message: birthDayGet.message,
          }
        );

        if (response.data.status === "sent") {
          birthDayGet = { id: birthDayGet.id, sentToService: true };
          console.log("birthDayGet", birthDayGet);
          await birthday_messages.update(birthDayGet, {
            where: { id: birthDayGet.id, deletedAt: null },
          });
        }
      } catch (error) {
        if (axios.isAxiosError(error) && error.code === "ECONNABORTED") {
          console.error("Request timeout. Please try again later.");
        } else {
          console.error(
            `Failed to send birthday message to ${user.first_name}: ${error.message}`
          );
        }
      }
    });

    birthdayGet.forEach(async (user) => {
      try {
        console.log(",sad", user.birthday_messages_id);
        const monthName = getMonthName(user.birthDayDate);
        const dayName = getDayName(user.birthDayMonth);

        let bodyBirthday = {
          user_id: user.id,
          sentToService: user.sentToService,
          sentToUser: user.sentToUser,
          message: `Hey, ${user.first_name} ${user.last_name} ${dayName} ${monthName} is your birthday`,
        };

        const response = await axios.post(
          "https://email-service.digitalenvision.com.au/send-email",
          {
            email: user.email,
            message: bodyBirthday.message,
          }
        );

        console.log("response", response);

        if (response.data.status === "sent") {
          console.log(user.birthday_messages_id);
          bodyBirthday.sentToService = true;
          await birthday_messages.update(bodyBirthday, {
            where: { user_id: user.id, deletedAt: null },
          });
        } else {
          console.error(
            `Failed to send birthday message to ${user.first_name}: ${error.message}`
          );
        }
      } catch (error) {
        if (axios.isAxiosError(error) && error.code === "ECONNABORTED") {
          console.error("Request timeout. Please try again later.");
        } else {
          console.error(
            `Failed to send birthday message to ${user.first_name}: ${error.message}`
          );
        }
      }
    });

    res.status(200).json({
      status: 200,
      message: "Successfully added data",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: 500, message: "Internal error" });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ status: 400, message: errors.array()[0].msg });
    }

    const checkEmail = await users.findOneByEmail(req.body.email);

    if (!checkEmail) {
      return res.send({
        status: "failed",
        message: "Email or password wrong",
      });
    }

    const hashPassword = await bcrypt.compare(
      req.body.password,
      checkEmail.password
    );

    if (!hashPassword) {
      return res.send({
        status: "failed",
        message: "Email or password wrong",
      });
    }

    const secretKey = process.env.secretKey;

    const token = jwt.sign(
      {
        id: checkEmail.id,
      },
      secretKey
    );

    const getData = await users.findOnePassExclude(checkEmail.id);

    const responseData = {
      data: getData,
      token: token,
    };

    res.send({
      status: "success",
      data: responseData,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: 500, message: "Internal error" });
  }
};

exports.createUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ status: 400, message: errors.array()[0].msg });
    }

    const checkEmail = await users.findOneByEmail(req.body.email);

    if (checkEmail) {
      return res.send({
        status: "Failed",
        message: "Email Already Registered",
      });
    }

    const hashPassword = await bcrypt.hash(req.body.password, 10);

    const userResponse = await users.create({
      ...req.body,
      password: hashPassword,
    });

    makeBirthDayForToday(userResponse);

    let getUser = await users.findOnePassExclude(userResponse.id);

    res.status(200).json({
      status: 200,
      message: "Successfully added data",
      data: getUser,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: 500, message: "Internal error" });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    let checkUser = await users.findOneById(userId);

    if (!checkUser) {
      return res.status(404).json({ status: 404, message: "User not found" });
    }

    let checkUserWithSameEmail = await users.findOne({
      where: {
        email: req.body.email,
        id: { [Op.ne]: userId },
        deletedAt: null,
      },
    });

    if (checkUserWithSameEmail) {
      return res
        .status(404)
        .json({ status: 404, message: "Email is Registered" });
    }

    checkUser = { ...req.body };

    if (req.body.password) {
      const hashPassword = await bcrypt.hash(req.body.password, 10);
      checkUser = {
        ...req.body,
        password: hashPassword,
      };
    }

    await users.update(checkUser, {
      where: { id: userId, deletedAt: null },
    });

    let getUser = await users.findOnePassExclude(userId);

    makeBirthDayForToday(getUser);
    const createdAtDate = new Date(getUser.birthday);
    let month = createdAtDate.getMonth() + 1;
    let date = createdAtDate.getDate();

    let checkBirthday = await birthday_messages.findBirtdayByUserId(userId);

    if (checkBirthday) {
      checkBirthday.map(async (item) => {
        let itemD = new Date(item.birthday_now);
        const monthItem = itemD.getMonth() + 1;
        const dayItem = itemD.getDate();
        if (monthItem != month || dayItem != date) {
          item = { id: item.id, relevant: false };
          await birthday_messages.update(item, {
            where: { id: item.id, deletedAt: null },
          });
        } else if (monthItem == month && dayItem == date) {
          item = { id: item.id, relevant: true };
          await birthday_messages.update(item, {
            where: { id: item.id, deletedAt: null },
          });
        }
      });
    }

    res.status(200).json({
      status: 200,
      message: "Successfully updated data",
      data: getUser,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 500, message: "Internal error" });
  }
};

exports.findUserById = async (req, res) => {
  try {
    const userId = req.params.id;

    let checkUser = await users.findOneById(userId);

    if (!checkUser) {
      return res.status(404).json({ status: 404, message: "User not found" });
    }

    res.status(200).json({
      status: 200,
      message: `Success`,
      data: checkUser,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 500, message: "Internal error" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    let checkUser = await users.findOneById(userId);

    if (!checkUser) {
      return res.status(404).json({ status: 404, message: "User not found" });
    }

    checkUser = {
      deletedAt: new Date(),
    };

    const deletedRowCount = await users.update(checkUser, {
      where: { id: userId, deletedAt: null },
    });

    let checkBirthday = await birthday_messages.findBirtdayByUserId(userId);

    if (checkBirthday) {
      checkBirthday.map(async (itemBirthDay) => {
        itemBirthDay = {
          id: itemBirthDay.id,
          deletedAt: new Date(),
        };
        await birthday_messages.update(itemBirthDay, {
          where: { id: itemBirthDay.id, deletedAt: null },
        });
      });
    }

    if (deletedRowCount[0] == 0) {
      return res.status(404).json({ status: 404, message: "Something Wrong" });
    }

    res.status(200).json({
      status: 200,
      message: `Successfully deleted user with id: ${userId}`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 500, message: "Internal error" });
  }
};

function getMonthName(monthNumber) {
  const date = new Date(2000, monthNumber - 1, 1);
  return date.toLocaleString("en-US", { month: "long" });
}

function getDayName(dayNumber) {
  const date = new Date(2000, 0, dayNumber);
  return date.toLocaleString("en-US", { weekday: "long" });
}

async function makeBirthDayForToday(userResponse) {
  let d = new Date();
  let month = d.getMonth() + 1;
  let date = d.getDate();
  const usersGet = await users.findOneByBirthdayTodayLockTrue(
    month,
    date,
    userResponse.id
  );

  if (usersGet.length > 0) {
    if (usersGet[0].month == month && date == usersGet[0].date) {
      d = new Date(
        `${d.getFullYear()}-${usersGet[0].month}-${usersGet[0].date}`
      );

      const checkMessage =
        await birthday_messages.findBirtdayByUserIdAndBirthdayIrrelevant(
          usersGet[0].id,
          d
        );

      let bodyBirthday = {
        user_id: usersGet[0].id,
        sentToService: false,
        birthday_now: d,
        sentToUser: false,
        relevant: true,
        message: `Hey, ${usersGet[0].first_name} ${usersGet[0].last_name}  it's your birthday`,
      };

      let birthDayGet = undefined;
      if (!checkMessage) {
        birthDayGet = await birthday_messages.create(bodyBirthday);
      } else if (checkMessage) {
        birthDayGet = checkMessage;
        birthDayGet = { id: birthDayGet.id, relevant: true };
        await birthday_messages.update(birthDayGet, {
          where: { id: birthDayGet.id, deletedAt: null },
        });
      }
    }
  }
}
