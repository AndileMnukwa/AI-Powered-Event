module.exports = (sequelize, DataTypes) => {
    const Reviews = sequelize.define("Reviews", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: { notEmpty: true },
        },
        review_text: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: { notEmpty: true },
        },
        rating: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: { min: 1, max: 5 },
        },
        sentiment: {  
            type: DataTypes.STRING,
            allowNull: true, 
        },
        admin_response: {
            type: DataTypes.TEXT,
            allowNull: true, 
        }
    }, 
    {
        tableName: 'reviews', // <-- Add this line
        timestamps: true // Keep this if you had it before, or add if needed
      });

    Reviews.associate = (models) => {
        Reviews.belongsTo(models.Events, {
            foreignKey: "EventId",  // ✅ Match SQL script
            onDelete: "CASCADE",
        });
        Reviews.belongsTo(models.Users, {
            foreignKey: "UserId",  // ✅ Match SQL script
            onDelete: "CASCADE",
        });
    };

    return Reviews;
};
