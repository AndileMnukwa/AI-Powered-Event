'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Registrations', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      fullName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: false
      },
      address: {
        type: Sequelize.STRING,
        allowNull: true
      },
      city: {
        type: Sequelize.STRING,
        allowNull: true
      },
      state: {
        type: Sequelize.STRING,
        allowNull: true
      },
      zipCode: {
        type: Sequelize.STRING,
        allowNull: true
      },
      specialRequirements: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      ticketQuantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      registrationDate: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      paymentStatus: {
        type: Sequelize.CHECK('pending', 'completed', 'failed', 'refunded', 'free'),
        allowNull: false,
        defaultValue: 'pending'
      },
      totalAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      paymentMethod: {
        type: Sequelize.STRING,
        allowNull: true
      },
      paymentDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      transactionId: {
        type: Sequelize.STRING,
        allowNull: true
      },
      confirmationCode: {
        type: Sequelize.STRING,
        allowNull: true
      },
      checkInStatus: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      checkInTime: {
        type: Sequelize.DATE,
        allowNull: true
      },
      EventId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Events',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      UserId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'SET NULL'
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

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Registrations');
  }
};