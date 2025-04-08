module.exports = (sequelize, DataTypes) => {
  const Notifications = sequelize.define("Notifications", {
    message: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    relatedId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    isAdminNotification: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  }, 
  {
    tableName: 'notifications', // <-- Add this line
    timestamps: true // Keep this if you had it before, or add if needed
  });

  Notifications.associate = (models) => {
    Notifications.belongsTo(models.Users, {
      foreignKey: "userId",
      as: "user",
    });
  };

  return Notifications;
};