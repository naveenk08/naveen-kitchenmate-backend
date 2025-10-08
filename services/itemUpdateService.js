const db = require("../config/db"); // Your database connection
const moment = require("moment-timezone");

const resetItemQuantities = async () => {
  try {
    // Get the current time in IST
    const nowIST = moment().tz("Asia/Kolkata");
    const currentHourIST = nowIST.format("HH:mm"); // Example: "14:00"

    console.log(`Running quantity reset Job :  ${currentHourIST}`);


    // Update itemqty to dailyqty where dailyref is 1 and matches itemRefTime in kitchen table
    const query = `
     UPDATE kt_items i
 JOIN kt_kitchens k ON i.kitchenid = k.id 
 SET i.itemAvailable = 1
 WHERE i.dailyRefresh = 1 
 and k.sub_level > 1
 and (select memberValue from kt_appConfig where memberName = 'itemReset' ) = ?
 ;
    `;

    const update = await db.execute(query, [currentHourIST]);
    

    if(update[0].affectedRows>0){
        console.log(`Item quantities reset successfully at IST ${currentHourIST}`);
    }
   
  } catch (error) {
    console.error("Error resetting item quantities:", error);
  }
};

module.exports = { resetItemQuantities };
