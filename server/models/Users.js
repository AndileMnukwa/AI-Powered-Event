module.exports = (sequelize, DataTypes) => {
    const Users = sequelize.define("Users", {
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        isAdmin: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        resetPasswordToken: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        resetPasswordExpires: {
            type: DataTypes.DATE,
            allowNull: true,
        }
    },
    {
        tableName: 'Users', // <-- Add this line
        timestamps: true // Keep this if you had it before, or add if needed
    });

    Users.associate = (models) => {
        // Association with Events (if needed)
        Users.belongsTo(models.Events, {
            foreignKey: "eventId",
            onDelete: "CASCADE",
            allowNull: true,
        });

        // Association with Reviews
        Users.hasMany(models.Reviews, {
            foreignKey: "userId",
            onDelete: "CASCADE",
        });
    };

    return Users;
};