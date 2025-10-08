const db = require("../config/db");

const getAllCategory = async (id) => {
  const [rows] = await db.query(`SELECT id catId, mapValue catName FROM kt_masterMapping 
    where kitchenId in (0,${id}) and mapType = 'Category' and delFlag=0`);
  return rows;
};
const getAllActiveCategory = async (id) => {
  const [rows] = await db.query(`SELECT id catId, mapValue catName FROM kt_masterMapping 
    where kitchenId in (0,${id}) and mapType = 'Category' and delFlag=0`);
  return rows;
};

const getCategoryForKitchen = async (id) => {
  const [rows] = await db.query(
    `select distinct kc.id catId ,kc.mapValue catName  
      from kt_items ki ,kt_kitchens kk ,kt_masterMapping kc 
      where ki.kitchenid = kk.id 
      and ki.itemCategory = kc.id 
      and kk.id = ?
      and kc.mapType='Category'
      and kc.delFlag=0
      order by kc.mapValue;`,
    [id]
  );

  return rows;
};
const addCategory = async (kitchenId,name,description) => {
  const [rows] = await db.query(
    `insert into kt_masterMapping (mapType,kitchenId, mapValue,mapDesc, delFlag,updatetime)
    values ('Category',?,?,?,0,sysdate())`,
    [kitchenId,name,description]
  );

  return rows;
};
const deleteCategory = async (id) => {
  const [rows] = await db.query(
    `update kt_masterMapping set delFlag = 1, updatetime=sysdate() where id = ?`,
    [id]
  );

  return rows;
};

module.exports = { getAllCategory,getAllActiveCategory, getCategoryForKitchen ,addCategory,deleteCategory};
