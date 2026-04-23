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
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_NAME LIKE '%Municip%' OR TABLE_NAME LIKE '%Cidade%' OR TABLE_NAME LIKE '%Estado%'
ORDER BY TABLE_NAME
`
const [rows] = await s.query(sql)
console.log(JSON.stringify(rows, null, 2))
await s.close()
