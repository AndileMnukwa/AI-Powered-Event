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
            type: DataTypes.STRING,
            allowNull: false,
        },
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false,
        }
    });

    // ✅ Association with Reviews
    Events.associate = (models) => {
        Events.hasMany(models.Reviews, {
            foreignKey: "eventId",  // ✅ Must match Reviews model
            onDelete: "CASCADE",
        });
    };

    return Events;
};
