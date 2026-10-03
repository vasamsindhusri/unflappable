require('dotenv').config();
console.log("Mongo URI:", process.env.MONGO_URI);
require('dns').setServers(['8.8.8.8', '1.1.1.1']);
const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
});
