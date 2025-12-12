require('dotenv').config();
const bodyParser = require('body-parser');
const { startResetJob } = require('./jobs/itemResetJob');


const app = require('./app');

startResetJob();

const PORT = 3001

app.listen(PORT,'0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
