require('dotenv').config();
const { Sequelize } = require('sequelize');
const migration = require('./src/config/migrations/create_questionnaire_results_table.js');

// Use your existing database connection from .env with SSL
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
);

async function createTable() {
  try {
    console.log('🚀 Creating questionnaire_results table...');
    
    // Run the migration
    await migration.up(sequelize.getQueryInterface(), Sequelize);
    
    console.log('✅ questionnaire_results table created successfully!');
    console.log('📊 All indexes added');
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating table:', error.message);
    await sequelize.close();
    process.exit(1);
  }
}

createTable();
