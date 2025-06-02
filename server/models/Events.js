module.exports = (sequelize, DataTypes) => {
  const Events = sequelize.define("Events", {
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    // New fields for paid events support
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    isPaid: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    ticketsAvailable: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    registrationDeadline: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    maxRegistrations: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    minRegistrations: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1,
    },
    status: {
      type: DataTypes.ENUM('active', 'cancelled', 'completed', 'draft'),
      defaultValue: 'draft',
    }
  }, // <-- Correctly close the configuration object here
  {
    tableName: 'events', // <-- Add this line
    timestamps: true // Keep this if you had it before, or add if needed
  });

  // Define associations
  Events.associate = (models) => {
    Events.hasMany(models.Reviews, {
      onDelete: "cascade",
    });

    // Add association for registrations
    Events.hasMany(models.Registrations, {
      onDelete: "cascade",
    });

    // Add association with user who created the event
    Events.belongsTo(models.Users, {
      foreignKey: 'userId',
      as: 'organizer',
      allowNull: true,
    });
  };

  return Events;
};