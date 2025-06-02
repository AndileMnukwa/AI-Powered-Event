module.exports = (sequelize, DataTypes) => {
    const Registrations = sequelize.define("Registrations", {
      fullName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isEmail: true,
        },
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      address: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      city: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      state: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      zipCode: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      specialRequirements: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      ticketQuantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      registrationDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      paymentStatus: {
        type: DataTypes.CHECK('pending', 'completed', 'failed', 'refunded', 'free'),
        allowNull: false,
        defaultValue: 'pending',
      },
      totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      paymentMethod: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      paymentDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      transactionId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      confirmationCode: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      checkInStatus: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      checkInTime: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'registrations', // <-- Add this line
      timestamps: true // Keep this if you had it before, or add if needed
    });
  
    // Define associations
    Registrations.associate = (models) => {
      // Each registration belongs to an event
      Registrations.belongsTo(models.Events, {
        foreignKey: {
          name: "EventId",
          allowNull: false,
        },
        onDelete: "CASCADE",
      });
  
      // Registration can be associated with a user (optional - for logged-in users)
      Registrations.belongsTo(models.Users, {
        foreignKey: {
          name: "UserId",
          allowNull: true,
        },
        onDelete: "SET NULL",
      });
    };
  
    return Registrations;
  };