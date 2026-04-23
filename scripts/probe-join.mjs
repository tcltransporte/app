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
SELECT TOP 3 ef.codigo_empresa_filial, ef.CodigoMunicipio,
  m.codigo_municipio, m.codigo_municipio_ibge, m.nome_municipio, m.codigo_uf
FROM empresa_filial ef
LEFT JOIN municipio m ON m.codigo_municipio = ef.CodigoMunicipio
WHERE ef.CodigoMunicipio IS NOT NULL
`
const [rows] = await s.query(sql)
console.log(JSON.stringify(rows, null, 2))
await s.close()
