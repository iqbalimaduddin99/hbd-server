"use strict";
const { Model, Op } = require("sequelize");
const birthdaymessage = require("./birthdaymessage");
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  User.init(
    {
      first_name: DataTypes.STRING,
      last_name: DataTypes.STRING,
      birthday: DataTypes.DATE,
      location: DataTypes.TEXT,
      email: DataTypes.STRING,
      password: DataTypes.TEXT,
      deletedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "users",
    }
  );

  User.findOneByEmail = async (email) => {
    try {
      const result = await User.findOne({
        where: {
          email, deletedAt:null
        },
      });
      return result;
    } catch (error) {
      console.error("Error :", error);
      throw error;
    }
  };

  User.findAllByBirthdayTodayLockTrue = async (month, date) => {
    try {
      const result = await sequelize.query(
        `SELECT *, EXTRACT('MONTH' FROM birthday) AS month, EXTRACT('DAY' FROM birthday) AS date 
        FROM users AS u
        WHERE EXTRACT('MONTH' FROM birthday) = :month AND EXTRACT('DAY' FROM birthday) = :date AND u."deletedAt" is null FOR UPDATE;`,
        {
          replacements: { month, date },
          type: sequelize.QueryTypes.SELECT,
        }
      );
      return result;
    } catch (error) {
      console.error("Error :", error);
      throw error;
    }
  };

  User.findOneByBirthdayTodayLockTrue = async (month, date, id) => {
    try {
      const result = await sequelize.query(
        `SELECT *, EXTRACT('MONTH' FROM birthday) AS month, EXTRACT('DAY' FROM birthday) AS date 
               FROM users AS u
               WHERE EXTRACT('MONTH' FROM birthday) = :month AND EXTRACT('DAY' FROM birthday) = :date AND u."deletedAt" is null and u.id = :id FOR UPDATE;`,
        {
          replacements: { month, date, id},
          type: sequelize.QueryTypes.SELECT,
        }
      );
      return result;
    } catch (error) {
      console.error("Error :", error);
      throw error;
    }
  };


  User.findOneById = async (userId) => {
    try {
      const result = await User.findOne({
        where: { id: userId, deletedAt: null },
      });
      return result;
    } catch (error) {
      console.error("Error :", error);
      throw error;
    }
  };

  User.findOnePassExclude = async (userId) => {
    try {
      const result = await User.findOne({
        where: { id: userId, deletedAt: null },
        attributes: {
          exclude: ["createdAt", "updatedAt", "deletedAt", "password"],
        },
      });
      return result;
    } catch (error) {
      console.error("Error :", error);
      throw error;
    }
  };

  // Custom Query
  User.customQuery = async (firstName) => {
    try {
      const result = await sequelize.query(
        "SELECT * FROM users WHERE first_name = :name",
        {
          replacements: { name: firstName },
          type: sequelize.QueryTypes.SELECT,
        }
      );
      return result;
    } catch (error) {
      console.error("Error querying users by location:", error);
      throw error;
    }
  };

  User.getUsersByLocation = async (location) => {
    try {
      const users = await User.findAll({
        where: {
          location: location,
        },
      });
      return users;
    } catch (error) {
      console.error("Error querying users by location:", error);
      throw error;
    }
  };

  return User;
};
