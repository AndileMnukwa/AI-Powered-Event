module.exports = (sequelize, DataTypes) => {
    const Events = sequelize.define("Events", {
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        Date: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        Location: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        Description: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        Username: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    })

    return Events
}
