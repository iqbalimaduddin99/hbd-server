'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('birthday_messages', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users',   // Nama tabel yang akan di-referensikan
          key: 'id'         // Kolom yang di-referensikan
        },
        onUpdate: 'SET NULL',
        onDelete: 'SET NULL'
      },
      sentToService: {
        type: Sequelize.BOOLEAN
      },
      sentToUser: {
        type: Sequelize.BOOLEAN
      },
      message: {
        type: Sequelize.TEXT
      },
      relevant: {
        type: Sequelize.BOOLEAN
      },
      birthday_now: {
        type: Sequelize.DATE
      },
      deletedAt: {
        type: Sequelize.DATE
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('birthday_messages');
  }
};