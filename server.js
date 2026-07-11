require('dotenv').config();


const app = require('./app');

const PORT = process.env.PORT || 3001;

// Only start the scheduler when running locally
if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on port ${PORT}`);
    });
}