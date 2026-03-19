import { Sequelize } from 'sequelize'
import * as tedious from 'tedious'

import { Company } from './models/company.model.js'
import { Solicitation } from './models/solicitation.model.js'
import { CompanyUser } from './models/companyUser.model.js'
import { CompanyBusiness } from './models/companyBusiness.model.js'
import { User } from './models/user.model.js'
import { UserMember } from './models/userMember.model.js'
import { Session } from './models/session.model.js'
import { Partner } from './models/partner.model.js'
import { SolicitationType } from './models/solicitationType.model.js'
import { SolicitationRequestType } from './models/solicitationRequestType.model.js'
import { SolicitationService } from './models/solicitationService.model.js'
import { SolicitationFinance } from './models/solicitationFinance.model.js'
import { Product } from './models/product.model.js'
import { Service } from './models/service.model.js'
import { SolicitationProduct } from './models/solicitationProduct.model.js'

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

  constructor() {

    super({
      host: process.env.DB_HOST, port: process.env.DB_PORT, database: process.env.DB_DATABASE, username: process.env.DB_USER, password: process.env.DB_PASSWORD, dialect: 'mssql', dialectModule: tedious, timezone: "-03:00", dialectOptions: { useUTC: false, options: { requestTimeout: 300000, encrypt: false } }, define: { timestamps: false },
      logging: (query, options) => {
        if (options.bind) {
          Object.keys(options.bind).forEach((key) => query = query.replace(`@${key}`, `'${options.bind[key]}'`))
        }
        console.log(query)
      },
    })

    this.Company = this.define('company', new Company(), { tableName: 'empresa_filial' })

    this.Solicitation = this.define('solicitation', new Solicitation(), { tableName: 'Solicitacao' })

    this.CompanyBusiness = this.define('companyBusiness', new CompanyBusiness(), { tableName: 'empresa' })

    this.CompanyUser = this.define('companyUser', new CompanyUser(), { tableName: 'companyUser' })

    this.Partner = this.define('partner', new Partner(), { tableName: 'pessoa' })

    this.SolicitationType = this.define('solicitationType', new SolicitationType(), { tableName: 'SolicitacaoTipo' })

    this.SolicitationRequestType = this.define('solicitationRequestType', new SolicitationRequestType(), { tableName: 'solicitationRequestType' })

    this.SolicitationProduct = this.define('solicitationProduct', new SolicitationProduct(), { tableName: 'SolicitacaoPecaUtilizada' })

    this.SolicitationService = this.define('solicitationService', new SolicitationService(), { tableName: 'SolicitacaoServicoRealizado' })

    this.SolicitationFinance = this.define('solicitationFinance', new SolicitationFinance(), { tableName: 'SolicitacaoFinanceiro' })

    this.Product = this.define('product', new Product(), { tableName: 'ItemEstoque' })

    this.Service = this.define('service', new Service(), { tableName: 'TipoServico' })

    this.Session = this.define('session', new Session(), { tableName: 'Session' })

    this.User = this.define('user', new User(), { tableName: 'aspnet_Users' })

    this.UserMember = this.define('userMember', new UserMember(), { tableName: 'aspnet_Membership' })

    //this.Company.belongsTo(this.City, { as: 'city', foreignKey: 'CodigoMunicipio', onDelete: 'CASCADE' })
    this.Company.hasMany(this.CompanyUser, { as: 'companyUsers', foreignKey: 'companyId' })
    //this.Company.hasMany(this.CompanyNfseTributation, { as: 'tributations', foreignKey: 'companyId', onDelete: 'CASCADE' })
    this.Company.belongsTo(this.CompanyBusiness, { as: 'companyBusiness', foreignKey: 'companyBusinessId' })
    this.Company.hasMany(this.SolicitationType, { as: 'solicitationTypes', foreignKey: 'companyId' })
    this.Company.hasMany(this.Solicitation, { as: 'solicitations', foreignKey: 'companyId' })


    this.CompanyBusiness.hasMany(this.Company, { as: 'companies', foreignKey: 'companyBusinessId' })

    this.CompanyUser.belongsTo(this.User, { as: 'user', foreignKey: 'userId' })
    this.CompanyUser.belongsTo(this.Company, { as: 'company', foreignKey: 'companyId' })

    this.Session.belongsTo(this.User, { as: 'user', foreignKey: 'userId' })
    this.Session.belongsTo(this.Company, { as: 'company', foreignKey: 'companyId' })

    this.SolicitationType.belongsTo(this.Company, { as: 'company', foreignKey: 'companyId' })
    this.SolicitationType.hasMany(this.Solicitation, { as: 'solicitations', foreignKey: 'typeId' })

    this.Solicitation.belongsTo(this.Company, { as: 'company', foreignKey: 'companyId' })
    this.Solicitation.belongsTo(this.Partner, { as: 'partner', foreignKey: 'partnerId' })
    this.Solicitation.belongsTo(this.SolicitationType, { as: 'type', foreignKey: 'typeId' })
    this.Solicitation.hasMany(this.SolicitationProduct, { as: 'products', foreignKey: 'solicitationId' })
    this.Solicitation.hasMany(this.SolicitationService, { as: 'services', foreignKey: 'solicitationId' })

    this.SolicitationProduct.belongsTo(this.Product, { as: 'product', foreignKey: 'itemId' })
    this.SolicitationService.belongsTo(this.Service, { as: 'service', foreignKey: 'itemId' })

    this.Solicitation.hasMany(this.SolicitationFinance, { as: 'payments', foreignKey: 'solicitationId' })
    this.SolicitationFinance.belongsTo(this.Solicitation, { as: 'solicitation', foreignKey: 'solicitationId' })

    this.SolicitationProduct.belongsTo(this.Solicitation, { as: 'solicitation', foreignKey: 'solicitationId' })


    this.User.hasMany(this.CompanyUser, { as: 'companyUsers', foreignKey: 'userId' })
    this.User.belongsTo(this.UserMember, { as: 'userMember', foreignKey: 'userId', targetKey: 'userId' })
    //this.User.belongsTo(this.Partner, { as: 'employee', foreignKey: 'employeeId', targetKey: 'codigo_pessoa', onDelete: 'CASCADE' })


    this.Company.addHook('afterFind', afterFind)
    this.CompanyBusiness.addHook('afterFind', afterFind)
    this.CompanyUser.addHook('afterFind', afterFind)
    this.User.addHook('afterFind', afterFind)
    this.UserMember.addHook('afterFind', afterFind)
    this.SolicitationType.addHook('afterFind', afterFind)
    this.SolicitationRequestType.addHook('afterFind', afterFind)
    this.Solicitation.addHook('afterFind', afterFind)
    this.SolicitationProduct.addHook('afterFind', afterFind)
    this.SolicitationService.addHook('afterFind', afterFind)
    this.SolicitationFinance.addHook('afterFind', afterFind)
    this.Product.addHook('afterFind', afterFind)


  }

}