import mongoose from 'mongoose'
const db_url = process.env.DB_URL;

/**
 * Initializes the db connection.
 */
const initializeDBConnection = async () => {
  try {
    if (db_url) {
      await mongoose
        .connect(db_url)
        .then(() => console.info('Database connection established'))
        .catch(err => console.error(err));
    } else {
      console.error('Database config values are empty');
      throw new Error('Database config values are empty');
    }
  } catch (err) {
    throw err;
  }
};

export default initializeDBConnection;