const db = require("../config/db");
const generateSignedUrl = require("../services/getSignedUrl");

const getAllItemByKitchenId = async (id) => {
  const [rows] = await db.query(
    "SELECT * FROM kt_items where kitchenid = ? order by itemName asc",
    [id]
  );
  return rows;
};
const getItemById = async (id) => {
  const [rows] = await db.query("SELECT * FROM kt_items where itemid = ?", [
    id,
  ]);
  return rows;
};

const getitemsByCategoryAndKitchen = async (kitchenid, catId) => {


  const [rows] = await db.query(
    `SELECT ki.*,kc.mapValue prepKitchenName,kc.mapDesc printerName 
    FROM kt_items ki, kt_masterMapping kc where ki.prepKitchen = kc.id 
     and ki.kitchenid = ? and itemCategory = ? order by itemName asc`,
    [kitchenid, catId]
  );
  const updatedRows = await Promise.all(
    rows.map(async (item) => ({
      ...item,
      itemImage: item.itemImg ? await generateSignedUrl(item.itemImg) : null,
    }))
  );

  return updatedRows;
};
const getItemByKitchen = async (kitchenid) => {
  const [rows] = await db.query(
    `SELECT 
    c.id catId,
    c.mapValue catName,
    c.mapDesc,
    COUNT(i.itemid) AS item_count,
    JSON_ARRAYAGG(
        JSON_OBJECT(
            'itemId', i.itemid,
            'itemName', i.itemName,
            'itemDesc1', i.itemDesc1,
            'itemDesc2', i.itemDesc2,
            'itemRate', i.itemRate,
            'packingRate', i.packingRate,
            'dailyRefresh', i.dailyRefresh,
            'itemAvailable', i.itemAvailable,
            'prepKitchen', mm.mapValue,
            'printerName', mm.mapDesc,
            'itemImg', i.itemImg,
            'updatetime', i.updatetime
        )
    ) AS items
    FROM 
        kt_masterMapping c
    LEFT JOIN 
        kt_items i ON c.id = i.itemCategory 
        and c.mapType = 'Category'
     JOIN
        kt_masterMapping mm on mm.id = i.prepKitchen
    where i.kitchenId = ?
    GROUP BY 
        c.id, c.mapValue, c.mapDesc
    ORDER BY 
    c.mapValue;`,
    [kitchenid]
  );
  
  const updatedRows = await Promise.all(
    rows.map(async (category) => {
      // Handle cases where there are no items
      if (!category.items || category.item_count === 0) {
        return {
          ...category,
          items: []
        };
      }

      // Parse items if needed
      const items = typeof category.items === 'string' 
        ? JSON.parse(category.items) 
        : category.items;

      // Filter out null items (from LEFT JOIN)
      const filteredItems = items.filter(item => item !== null);

      // Sort items by itemName (case insensitive)
      const sortedItems = filteredItems.sort((a, b) => {
        const nameA = a.itemName?.toUpperCase() || '';
        const nameB = b.itemName?.toUpperCase() || '';
        return nameA.localeCompare(nameB);
      });

      // Process each item
      // const updatedItems = await Promise.all(
      //   sortedItems.map(async (item) => {
      //     const signedUrl = item.itemImg ? await generateSignedUrl(item.itemImg) : null;
      //     return {
      //       ...item,
      //       itemImage: signedUrl,
      //     };
      //   })
      // );

      return {
        ...category,
        items: sortedItems
      };
    })
  );

  return updatedRows;
};

const getItemImageByKitchen = async (kitchenid) => {
  const [rows] = await db.query(
    `SELECT 
    c.id catId,
    c.mapValue catName,
    c.mapDesc,
    COUNT(i.itemid) AS item_count,
    JSON_ARRAYAGG(
        JSON_OBJECT(
            'itemId', i.itemid,
            'itemName', i.itemName,
            'itemDesc1', i.itemDesc1,
            'itemDesc2', i.itemDesc2,
            'itemRate', i.itemRate,
            'packingRate', i.packingRate,
            'dailyRefresh', i.dailyRefresh,
            'itemAvailable', i.itemAvailable,
            'prepKitchen', mm.mapValue,
            'printerName', mm.mapDesc,
            'itemImg', i.itemImg,
            'updatetime', i.updatetime
        )
    ) AS items
    FROM 
        kt_masterMapping c
    LEFT JOIN 
        kt_items i ON c.id = i.itemCategory 
        and c.mapType = 'Category'
     JOIN
        kt_masterMapping mm on mm.id = i.prepKitchen
    where i.kitchenId = ?
    GROUP BY 
        c.id, c.mapValue, c.mapDesc
    ORDER BY 
    c.mapValue;`,
    [kitchenid]
  );
  
  const updatedRows = await Promise.all(
    rows.map(async (category) => {
      // Handle cases where there are no items
      if (!category.items || category.item_count === 0) {
        return {
          ...category,
          items: []
        };
      }

      // Parse items if needed
      const items = typeof category.items === 'string' 
        ? JSON.parse(category.items) 
        : category.items;

      // Filter out null items (from LEFT JOIN)
      const filteredItems = items.filter(item => item !== null);

      // Sort items by itemName (case insensitive)
      const sortedItems = filteredItems.sort((a, b) => {
        const nameA = a.itemName?.toUpperCase() || '';
        const nameB = b.itemName?.toUpperCase() || '';
        return nameA.localeCompare(nameB);
      });

      // Process each item
      const updatedItems = await Promise.all(
        sortedItems.map(async (item) => {
          const signedUrl = item.itemImg ? await generateSignedUrl(item.itemImg) : null;
          return {
            ...item,
            itemImage: signedUrl,
          };
        })
      );

      return {
        ...category,
        items: updatedItems
      };
    })
  );

  return updatedRows;
};

const updateItem = async (
  id,
  name,
  catId,
  rate,
  packingRate,
  desc1,
  desc2,
  dailyRefresh,
  itemAvailable,
  prepKitchen
) => {
  const query = `UPDATE kt_items SET itemCategory=?,itemName=?,itemDesc1=?,itemDesc2=?,itemRate=?,packingRate=?,dailyRefresh=?,itemAvailable=?,prepKitchen=?,updatetime=sysdate() 
   WHERE itemid = ?`;
  const [result] = await db.query(query, [
    catId,
    name,
    desc1,
    desc2,
    rate,
    packingRate,
    dailyRefresh,
    itemAvailable,
    prepKitchen,
    id,
  ]);
  return result;
};
const updateItemImg = async (imageUrl, id) => {
  const query = `update kt_items set itemImg = '${imageUrl}' where itemid = ${id}`;
  const [result] = await db.query(query);
  return result;
};

const deleteItem = async (id) => {
  const query = `delete from kt_items where itemid = ?`;
  const [result] = await db.query(query, [id]);
  return result;
};

const insertItem = async (
  kitchenid,
  name,
  catId,
  counterId,
  rate,
  packingRate,
  desc1,
  desc2
) => {
  const query =
    "INSERT INTO kt_items (kitchenid,itemCategory,itemName,itemDesc1,itemDesc2,itemRate,packingRate,dailyRefresh,itemAvailable,prepKitchen,updatetime) VALUES (?, ?, ?, ?,?, ?,?,0,1,?,sysdate())";
  const [result] = await db.query(query, [
    kitchenid,
    catId,
    name,
    desc1,
    desc2,
    rate,
    packingRate,
    counterId
  ]);
  return result;
};

module.exports = {
  getAllItemByKitchenId,
  getitemsByCategoryAndKitchen,
  updateItem,
  insertItem,
  updateItemImg,
  deleteItem,
  getItemById,
  getItemByKitchen,
  getItemImageByKitchen
};
