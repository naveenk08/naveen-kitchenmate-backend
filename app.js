const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");


// const errorHandler = require("./middleware/errorHandler.js");

const ItemRoutes = require("./routes/itemRoute");
const CategoryRoutes = require("./routes/categoryRoute");
const AuthRoute = require("./routes/authRoute");
const s3TempKey = require("./routes/s3TempAccessRoute");
const OrderRoute = require("./routes/orderRoute");
const KitchenRoute = require("./routes/kitchenRoute");
const AppDataRoute = require("./routes/appDataRoute");
const ExpenseRoute = require("./routes/expenseRoute");
const AccountsRoute = require("./routes/accountsRoute");

const app = express();
app.use(express.json()); // Handles JSON requests
app.use(express.urlencoded({ extended: true })); // Handles URL-encoded form data
app.use(bodyParser.json());
app.use(cors({
  origin: "*", // Allow all for testing (replace with your frontend URL later)
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
}));

app.get('/', (req, res) => {
  console.log("GET / route hit");
    res.status(200).send('OK');
  });
    
// Routes
app.use("/api/category", CategoryRoutes);
app.use("/api/item", ItemRoutes);
app.use("/api/auth", AuthRoute);
app.use("/api/s3TempKey", s3TempKey);
app.use("/api/order", OrderRoute);
app.use("/api/kitchen", KitchenRoute);
app.use("/api/appData", AppDataRoute);
app.use("/api/expense", ExpenseRoute);
app.use("/api/accounts", AccountsRoute);

// Error Handler
// app.use(errorHandler);

module.exports = app;
