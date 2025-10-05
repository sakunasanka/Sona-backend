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

// --- Simple +05:30 handling ---
// 1) Tell Postgres session to use local timezone (affects NOW()/CURRENT_TIMESTAMP)
// 2) Ensure Sequelize-managed timestamps (createdAt/updatedAt) use +05:30 as well
// Note: This keeps it simple per the request; best practice is to store UTC and convert on read.

// Set DB session time zone for each new connection (PostgreSQL)
sequelize.addHook('afterConnect', async (connection: any) => {
  try {
    // Use IANA zone or fixed offset; here we use fixed +05:30 as requested
    await new Promise<void>((resolve, reject) => {
      connection.query("SET TIME ZONE '+05:30';", (err: any) => {
        if (err) reject(err); else resolve();
      });
    });
  } catch (err) {
    console.warn('Failed to set session time zone to +05:30:', err);
  }
});

// Apply +05:30 offset for Sequelize-managed timestamps
const nowPlus0530 = () => new Date(Date.now() + (5.5 * 60 * 60 * 1000)); // 5h30m in ms

sequelize.addHook('beforeCreate', (instance: any) => {
  if (!instance || !instance.dataValues) return;
  if ('createdAt' in instance.dataValues) instance.set('createdAt', nowPlus0530());
  if ('created_at' in instance.dataValues) instance.set('created_at', nowPlus0530());
  if ('updatedAt' in instance.dataValues) instance.set('updatedAt', nowPlus0530());
  if ('updated_at' in instance.dataValues) instance.set('updated_at', nowPlus0530());
  if ('login_at' in instance.dataValues) instance.set('login_at', nowPlus0530());
});

sequelize.addHook('beforeUpdate', (instance: any) => {
  if (!instance || !instance.dataValues) return;
  if ('updatedAt' in instance.dataValues) instance.set('updatedAt', nowPlus0530());
  if ('updated_at' in instance.dataValues) instance.set('updated_at', nowPlus0530());
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL Connected...');
  } catch (error) {
    console.error('Unable to connect to PostgreSQL:', error);
    process.exit(1);
  }
};

export { sequelize, connectDB };