// models/EventAnalytics.js 
module.exports = (sequelize, DataTypes) => {
    const EventAnalytics = sequelize.define("EventAnalytics", {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      event_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      attendance_data: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
          const value = this.getDataValue('attendance_data');
          return value ? JSON.parse(value) : null;
        },
        set(value) {
          this.setDataValue('attendance_data', JSON.stringify(value));
        }
      },
      satisfaction_data: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
          const value = this.getDataValue('satisfaction_data');
          return value ? JSON.parse(value) : null;
        },
        set(value) {
          this.setDataValue('satisfaction_data', JSON.stringify(value));
        }
      },
      rating_breakdown: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
          const value = this.getDataValue('rating_breakdown');
          return value ? JSON.parse(value) : null;
        },
        set(value) {
          this.setDataValue('rating_breakdown', JSON.stringify(value));
        }
      },
      engagement_over_time: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
          const value = this.getDataValue('engagement_over_time');
          return value ? JSON.parse(value) : null;
        },
        set(value) {
          this.setDataValue('engagement_over_time', JSON.stringify(value));
        }
      },
      ai_insights: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
          const value = this.getDataValue('ai_insights');
          return value ? JSON.parse(value) : null;
        },
        set(value) {
          this.setDataValue('ai_insights', JSON.stringify(value));
        }
      },
      sentiment_positive_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      sentiment_neutral_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      sentiment_negative_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      total_reviews: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      average_rating: {
        type: DataTypes.FLOAT,
        defaultValue: 0
      },
      total_attendance: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      }
    },
    {
      tableName: 'eventanalytics', 
      timestamps: true 
    });
  
    EventAnalytics.associate = (models) => {
      EventAnalytics.belongsTo(models.Events, {
        foreignKey: "event_id",
        onDelete: "CASCADE"
      });
    };
  
    return EventAnalytics;
  };