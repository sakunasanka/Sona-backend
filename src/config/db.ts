import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME!,
  process.env.DB_USER!,
  process.env.DB_PASSWORD!,
  {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false // Use this if you're connecting to a cloud database with SSL
      }
    }
  }
);

const connectAndSyncDb = async () => {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL Connected...');
    // This will read your models and create/update tables accordingly.
    await sequelize.sync({ alter: true });
    console.log('All models were synchronized successfully.');
  } catch (error) {
    console.error('Unable to connect to or sync the database:', error);
    // Exit the process if DB connection fails, as the app cannot run without it.
    process.exit(1);
  }
};

export { sequelize, connectAndSyncDb };