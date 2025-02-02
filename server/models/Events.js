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
            type: DataTypes.DATEONLY, // ✅ Make sure this is DATEONLY if you're sending 'YYYY-MM-DD'
            allowNull: false,
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false,
        }
    });

    return Events;
};
