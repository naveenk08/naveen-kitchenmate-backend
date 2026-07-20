const db = require("../config/db");

const getAppData = async () => {
  const [rows] = await db.query("SELECT * FROM kt_appConfig");
  return rows;
};
const getUrl = async () => {
  const [rows] = await db.query("SELECT * FROM kt_appConfig");
  return rows;
};
const getVersion = async () => {
  const [rows] = await db.query(`
SELECT
    memberValue AS versionCode,
    metadata->'$.version_name' as versionName,
    metadata->'$.mandatory' AS mandatory,
    metadata->'$.download_url' as url,
    metadata->'$.release_notes' as releaseNotes,
    metadata->'$.size' as size
FROM kt_appconfig 
WHERE memberName = 'app_version'
ORDER BY id DESC 
LIMIT 1;
`);
  return rows;
};

const updateVersion = async (version) => {
  const { versionCode, versionName, mandatory, apkKey, releaseNotes } = version;
  const metadata = {
    version_code: versionCode,
    version_name: versionName,
    mandatory: mandatory,
    download_url: apkKey,
    release_notes: releaseNotes
  };
  const [result] = await db.query(
    `
    INSERT INTO kt_appconfig (memberName, memberDesc, memberValue, metadata, updatetime)
    VALUES ('app_version', 'app_version', ?, ?, SYSDATE())
    `,
    [versionCode, JSON.stringify(metadata)]
  );
  return result;
};

module.exports = { getAppData, getUrl, getVersion, updateVersion };
