module.exports = (sequelize, DataTypes) => {
    const Reviews = sequelize.define("Reviews", {
        review_text: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        rating: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
                max: 5,
            },
        }
    });

    Reviews.associate = (models) => {
        Reviews.belongsTo(models.Events, {
            foreignKey: "EventId",
            onDelete: "CASCADE",
        });
    };

    return Reviews;
};
