import { Sequelize } from 'sequelize'
import * as tedious from 'tedious'

import { Company } from './models/company.model.js'
import { CompanyUser } from './models/companyUser.model.js'
import { CompanyBusiness } from './models/companyBusiness.model.js'
import { User } from './models/user.model.js'
import { UserMember } from './models/userMember.model.js'
import { Session } from './models/session.model.js'

const afterFind = (result) => {
  const trimStrings = obj => {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = obj[key].trim()
      }
    }
  }

  if (Array.isArray(result)) {
    result.forEach(row => trimStrings(row.dataValues))
  } else if (result && result.dataValues) {
    trimStrings(result.dataValues)
  }
}

export class AppContext extends Sequelize {
  
  Company = this.define('company', new Company(), { tableName: 'empresa_filial' })

  CompanyBusiness = this.define('companyBusiness', new CompanyBusiness(), { tableName: 'empresa' })

  CompanyUser = this.define('companyUser', new CompanyUser(), { tableName: 'companyUser' })

  Session = this.define('session', new Session(), { tableName: 'Session' })

  User = this.define('user', new User(), { tableName: 'aspnet_Users' })

  UserMember = this.define('userMember', new UserMember(), { tableName: 'aspnet_Membership' })

  constructor() {

    super({ host: process.env.DB_HOST, port: process.env.DB_PORT, database: process.env.DB_DATABASE, username: process.env.DB_USER, password: process.env.DB_PASSWORD, dialect: 'mssql', dialectModule: tedious, timezone: "-03:00", dialectOptions: { useUTC: false, options: { requestTimeout: 300000, encrypt: false }}, define: { timestamps: false },
      logging: (query, options) => {
        if (options.bind) {
          Object.keys(options.bind).forEach((key) => query = query.replace(`@${key}`, `'${options.bind[key]}'`))
        }
        console.log(query)
      },
    })

    //this.Company.belongsTo(this.City, { as: 'city', foreignKey: 'CodigoMunicipio', onDelete: 'CASCADE' })
    this.Company.hasMany(this.CompanyUser, { as: 'companyUsers', foreignKey: 'companyId' })
    //this.Company.hasMany(this.CompanyNfseTributation, { as: 'tributations', foreignKey: 'companyId', onDelete: 'CASCADE' })
    this.Company.belongsTo(this.CompanyBusiness, { as: 'companyBusiness', foreignKey: 'companyBusinessId' })

    this.CompanyBusiness.hasMany(this.Company, { as: 'companies', foreignKey: 'companyBusinessId' })
    
    this.CompanyUser.belongsTo(this.User, { as: 'user', foreignKey: 'userId' })
    this.CompanyUser.belongsTo(this.Company, { as: 'company', foreignKey: 'companyId'})

    this.Session.belongsTo(this.User, { as: 'user', foreignKey: 'userId' })
    this.Session.belongsTo(this.Company, { as: 'company', foreignKey: 'companyId' })

    this.User.hasMany(this.CompanyUser, { as: 'companyUsers', foreignKey: 'userId' })
    this.User.belongsTo(this.UserMember, { as: 'userMember', foreignKey: 'userId', targetKey: 'userId' })
    //this.User.belongsTo(this.Partner, { as: 'employee', foreignKey: 'employeeId', targetKey: 'codigo_pessoa', onDelete: 'CASCADE' })


    this.Company.addHook('afterFind', afterFind)
    this.CompanyBusiness.addHook('afterFind', afterFind)
    this.CompanyUser.addHook('afterFind', afterFind)
    this.User.addHook('afterFind', afterFind)
    this.UserMember.addHook('afterFind', afterFind)

  }

}