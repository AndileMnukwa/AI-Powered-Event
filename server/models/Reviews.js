module.exports = (sequelize, DataTypes) => {
    const Reviews = sequelize.define("Reviews", {
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
        review_text: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
        rating: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
                max: 5,
            },
        },
        sentiment: {  // NEW COLUMN
            type: DataTypes.STRING,
            allowNull: true, // Allow null in case sentiment is not analyzed
        }
    }, { timestamps: true });

    Reviews.associate = (models) => {
        Reviews.belongsTo(models.Events, {
            foreignKey: "EventId",
            onDelete: "CASCADE",
        });
    
        Reviews.belongsTo(models.Users, {
            foreignKey: "UserId",
            onDelete: "CASCADE",
        });
    };

    return Reviews;
};
