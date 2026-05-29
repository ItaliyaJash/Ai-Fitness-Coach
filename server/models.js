import { DataTypes } from 'sequelize';
import sequelize from './db.js';

// 1. Profile Model
export const Profile = sequelize.define('Profile', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    defaultValue: 'Athlete',
  },
  fitnessLevel: {
    type: DataTypes.STRING,
    defaultValue: 'intermediate',
  },
  goals: {
    type: DataTypes.TEXT, // Store JSON stringified array of goals
    defaultValue: '["muscle"]',
    get() {
      const raw = this.getDataValue('goals');
      try {
        return raw ? JSON.parse(raw) : ['muscle'];
      } catch {
        return ['muscle'];
      }
    },
    set(val) {
      this.setDataValue('goals', JSON.stringify(val));
    }
  },
  preferredEquipment: {
    type: DataTypes.TEXT, // Store JSON stringified array of gear
    defaultValue: '["bodyweight", "dumbbells"]',
    get() {
      const raw = this.getDataValue('preferredEquipment');
      try {
        return raw ? JSON.parse(raw) : ['bodyweight', 'dumbbells'];
      } catch {
        return ['bodyweight', 'dumbbells'];
      }
    },
    set(val) {
      this.setDataValue('preferredEquipment', JSON.stringify(val));
    }
  },
  units: {
    type: DataTypes.STRING,
    defaultValue: 'kg',
  }
});

// 2. Workout History Model
export const Workout = sequelize.define('Workout', {
  id: {
    type: DataTypes.STRING, // Store client-generated UUID / timestamp
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  completedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  duration: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  totalVolume: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  completedExercises: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  muscleGroups: {
    type: DataTypes.TEXT, // JSON string array
    defaultValue: '[]',
    get() {
      const raw = this.getDataValue('muscleGroups');
      try {
        return raw ? JSON.parse(raw) : [];
      } catch {
        return [];
      }
    },
    set(val) {
      this.setDataValue('muscleGroups', JSON.stringify(val));
    }
  },
  emoji: {
    type: DataTypes.STRING,
    defaultValue: '🏋️',
  }
});

// 3. Personal Record Model
export const PersonalRecord = sequelize.define('PersonalRecord', {
  exerciseId: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  weight: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  reps: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  }
});

// 4. Body Stats Model
export const BodyStat = sequelize.define('BodyStat', {
  id: {
    type: DataTypes.STRING, // Client or server generated
    primaryKey: true,
  },
  weight: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  }
});
