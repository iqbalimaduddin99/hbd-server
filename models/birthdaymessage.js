"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class BirthdayMessage extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      BirthdayMessage.belongsTo(models.users, {
        foreignKey: "user_id",
      });
    }
  }
  
  BirthdayMessage.init(
    {
      user_id: DataTypes.INTEGER,
      birthday_now: DataTypes.DATE,
      sentToService: DataTypes.BOOLEAN,
      sentToUser: DataTypes.BOOLEAN,
      message: DataTypes.TEXT,
      relevant: DataTypes.BOOLEAN,
      deletedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "birthday_messages",
    }
  );

  BirthdayMessage.findBirtdayByUserIdAndBirthday = async (userId, date) => {
    try {
      const result = await BirthdayMessage.findOne({
        where: { user_id: userId, deletedAt: null, relevant:true, birthday_now:date },
      });
      return result;
    } catch (error) {
      console.error("Error :", error);
      throw error;
    }
  };

  BirthdayMessage.findBirtdayByUserIdAndBirthdayIrrelevant = async (userId, date) => {
    try {
      const result = await BirthdayMessage.findOne({
        where: { user_id: userId, deletedAt: null, birthday_now:date },
      });
      return result;
    } catch (error) {
      console.error("Error :", error);
      throw error;
    }
  };

  BirthdayMessage.findBirtdayByUserId = async (userId) => {
    try {
      const result = await BirthdayMessage.findAll({
        where: { user_id: userId, deletedAt: null },
      });
      return result;
    } catch (error) {
      console.error("Error :", error);
      throw error;
    }
  };

  
  BirthdayMessage.findAllBirthdayBySendToServerNotToday = async () => {
    try {
      const result = await sequelize.query(
        `SELECT
        rbm.*
       FROM
         (
         select
           u.*, EXTRACT('MONTH' FROM u.birthday) as birthDayMonth, EXTRACT('DAY' FROM u.birthday) as birthDayDate, bm.id as birthday_messages_id, bm."sentToService", bm."sentToUser", bm.message, 
           ROW_NUMBER() OVER (PARTITION BY bm.user_id ORDER BY bm.birthday_now  DESC) as row_num
         FROM birthday_messages bm
               INNER JOIN users u ON u.id = bm.user_id
         where 
         bm."sentToService" = false 
         AND EXTRACT('MONTH' FROM u.birthday) <> EXTRACT('MONTH' FROM CURRENT_DATE)
         AND EXTRACT('DAY' FROM u.birthday) <> EXTRACT('DAY' FROM CURRENT_DATE)
         and bm.relevant = true
         AND bm."deletedAt" IS null    
       ) as rbm
       WHERE
         rbm.row_num = 1;`,
        {
          type: sequelize.QueryTypes.SELECT,
        }
      );
      return result;
    } catch (error) {
      console.error("Error :", error);
      throw error;
    }
  };

  return BirthdayMessage;
};
