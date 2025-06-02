'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add price field
    await queryInterface.addColumn('Events', 'price', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    });
    
    // Add isPaid field
    await queryInterface.addColumn('Events', 'isPaid', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
    
    // Add ticketsAvailable field
    await queryInterface.addColumn('Events', 'ticketsAvailable', {
      type: Sequelize.INTEGER,
      allowNull: true
    });
    
    // Add registrationDeadline field
    await queryInterface.addColumn('Events', 'registrationDeadline', {
      type: Sequelize.DATE,
      allowNull: true
    });
    
    // Add maxRegistrations field
    await queryInterface.addColumn('Events', 'maxRegistrations', {
      type: Sequelize.INTEGER,
      allowNull: true
    });
    
    // Add minRegistrations field
    await queryInterface.addColumn('Events', 'minRegistrations', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 1
    });
    
    // Add status field
    await queryInterface.addColumn('Events', 'status', {
      type: Sequelize.CHECK('active', 'cancelled', 'completed', 'draft'),
      defaultValue: 'active'
    });

    // Add userId (for the organizer) if not already there
    try {
      await queryInterface.addColumn('Events', 'userId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        }
      });
    } catch (error) {
      console.log('userId column may already exist');
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Events', 'price');
    await queryInterface.removeColumn('Events', 'isPaid');
    await queryInterface.removeColumn('Events', 'ticketsAvailable');
    await queryInterface.removeColumn('Events', 'registrationDeadline');
    await queryInterface.removeColumn('Events', 'maxRegistrations');
    await queryInterface.removeColumn('Events', 'minRegistrations');
    await queryInterface.removeColumn('Events', 'status');
    
    try {
      await queryInterface.removeColumn('Events', 'userId');
    } catch (error) {
      console.log('userId column may not exist');
    }
  }
};