module.exports = {
  up: async (queryInterface, Sequelize) => {
      return queryInterface.addColumn("Reviews", "sentiment", {
          type: Sequelize.STRING,
          allowNull: true
      });
  },

  down: async (queryInterface, Sequelize) => {
      return queryInterface.removeColumn("Reviews", "sentiment");
  }
};
