module.exports = {
  PORT:        process.env.PORT        || 5000,
  MONGO_URI:   process.env.MONGO_URI,
  JWT_SECRET:  process.env.JWT_SECRET,
  JWT_EXPIRE:  process.env.JWT_EXPIRE  || '7d',
  // CLIENT_URL:  process.env.CLIENT_URL  || 'http://localhost:3000',
  CLIENT_URL:  process.env.CLIENT_URL  || 'https://fullfrontend-nine.vercel.app/',
  NODE_ENV:    process.env.NODE_ENV    || 'development',
};