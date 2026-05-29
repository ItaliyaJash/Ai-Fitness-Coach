import { Sequelize } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize SQLite Sequelize instance
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'fitcoach.db'),
  logging: false, // Turn off query logs in console
});

export async function connectDB() {
  try {
    await sequelize.authenticate();
    console.log('[Database] SQLite connected successfully.');
    
    // Sync models to database schema
    await sequelize.sync({ alter: true });
    console.log('[Database] All models synced successfully.');
  } catch (error) {
    console.error('[Database] Failed to connect to SQLite:', error);
    process.exit(1);
  }
}

export default sequelize;
