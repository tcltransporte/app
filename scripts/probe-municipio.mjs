import "dotenv/config"
import tedious from "tedious"
import { Sequelize } from "sequelize"

const s = new Sequelize(process.env.DB_DATABASE, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: "mssql",
  dialectModule: tedious,
  logging: false,
  dialectOptions: { options: { encrypt: false, requestTimeout: 20000 } },
})

const sql = `
SELECT COLUMN_NAME, DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'municipio'
ORDER BY ORDINAL_POSITION
`
const [rows] = await s.query(sql)
console.log(JSON.stringify(rows, null, 2))
await s.close()
