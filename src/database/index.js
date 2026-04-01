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
import { SolicitationStatus } from './models/solicitationStatus.model.js'
import { SolicitationStatusWorkflow } from './models/solicitationStatusWorkflow.model.js'
import { SolicitationStatusTipo } from './models/solicitationStatusTipo.model.js'
import { Document } from './models/document.model.js'
import { DocumentType } from './models/documentType.model.js'
import { DocumentRequestType } from './models/documentRequestType.model.js'
import { SolicitationDocument } from './models/solicitationDocument.model.js'
import { DocumentProduct } from './models/documentProduct.model.js'
import { DocumentService } from './models/documentService.model.js'
import { FinanceTitle } from './models/financeTitle.model.js'
import { FinanceEntry } from './models/financeEntry.model.js'
import { FreightLetter } from './models/freightLetter.model.js'
import { FreightLetterComponentType } from './models/freightLetterComponentType.model.js'

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

let instance = null

export class AppContext extends Sequelize {

  constructor() {

    if (instance) {
      return instance
    }

    super({
      host: process.env.DB_HOST, port: process.env.DB_PORT, database: process.env.DB_DATABASE, username: process.env.DB_USER, password: process.env.DB_PASSWORD, dialect: 'mssql', dialectModule: tedious, timezone: "-03:00", dialectOptions: { useUTC: false, options: { requestTimeout: 300000, encrypt: false } }, define: { timestamps: false },
      logging: (query, options) => {
        if (options.bind) {
          Object.keys(options.bind).forEach((key) => query = query.replace(`@${key}`, `'${options.bind[key]}'`))
        }
        console.log(query)
      },
    })

    instance = this

    this.Company = this.define('company', new Company(), { tableName: 'empresa_filial' })
    this.Solicitation = this.define('solicitation', new Solicitation(), { tableName: 'Solicitacao' })
    this.CompanyBusiness = this.define('companyBusiness', new CompanyBusiness(), { tableName: 'empresa' })
    this.CompanyUser = this.define('companyUser', new CompanyUser(), { tableName: 'companyUser' })
    this.Partner = this.define('partner', new Partner(), { tableName: 'pessoa' })
    this.SolicitationType = this.define('solicitationType', new SolicitationType(), { tableName: 'SolicitacaoTipo' })
    this.SolicitationStatus = this.define('solicitationStatus', new SolicitationStatus(), { tableName: 'SolicitacaoStatus' })
    this.SolicitationStatusWorkflow = this.define('solicitationStatusWorkflow', new SolicitationStatusWorkflow(), { tableName: 'SolicitacaoStatusWorkflow' })
    this.SolicitationStatusTipo = this.define('solicitationStatusTipo', new SolicitationStatusTipo(), { tableName: 'SolicitacaoStatusTipo' })
    this.SolicitationRequestType = this.define('solicitationRequestType', new SolicitationRequestType(), { tableName: 'solicitationRequestType' })
    this.SolicitationProduct = this.define('solicitationProduct', new SolicitationProduct(), { tableName: 'SolicitacaoPecaUtilizada' })
    this.SolicitationService = this.define('solicitationService', new SolicitationService(), { tableName: 'SolicitacaoServicoRealizado' })
    this.SolicitationFinance = this.define('solicitationFinance', new SolicitationFinance(), { tableName: 'SolicitacaoFinanceiro' })
    this.Product = this.define('product', new Product(), { tableName: 'ItemEstoque' })
    this.Service = this.define('service', new Service(), { tableName: 'TipoServico' })
    this.Session = this.define('session', new Session(), { tableName: 'Session' })
    this.User = this.define('user', new User(), { tableName: 'aspnet_Users' })
    this.UserMember = this.define('userMember', new UserMember(), { tableName: 'aspnet_Membership' })
    this.Document = this.define('document', new Document(), { tableName: 'Compras' })
    this.DocumentType = this.define('documentType', new DocumentType(), { tableName: 'TipoModeloDocumento' })
    this.DocumentRequestType = this.define('documentRequestType', new DocumentRequestType(), { tableName: 'TipoNotaFiscal' })
    this.SolicitationDocument = this.define('solicitationDocument', new SolicitationDocument(), { tableName: 'solicitationDocument' })
    this.DocumentProduct = this.define('documentProduct', new DocumentProduct(), { tableName: 'ComprasItens' })
    this.DocumentService = this.define('documentService', new DocumentService(), { tableName: 'ComprasServicos' })
    this.FinanceTitle = this.define('financeTitle', new FinanceTitle(), { tableName: 'movimentos' })
    this.FinanceEntry = this.define('financeEntry', new FinanceEntry(), { tableName: 'movimentos_detalhe' })
    this.FreightLetter = this.define('freightLetter', new FreightLetter(), { tableName: 'CompValorCartaFrete' })
    this.FreightLetterComponentType = this.define('freightLetterComponentType', new FreightLetterComponentType(), { tableName: 'CompValorCartaFreteTipo' })

    this.Company.hasMany(this.CompanyUser, { as: 'companyUsers', foreignKey: 'companyId' })
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
    this.Solicitation.belongsTo(this.SolicitationStatus, { as: 'status', foreignKey: 'statusId' })
    this.Solicitation.hasMany(this.SolicitationProduct, { as: 'products', foreignKey: 'solicitationId' })
    this.Solicitation.hasMany(this.SolicitationService, { as: 'services', foreignKey: 'solicitationId' })
    this.Solicitation.hasMany(this.SolicitationFinance, { as: 'payments', foreignKey: 'solicitationId' })
    this.Solicitation.hasMany(this.Document, { as: 'documents', foreignKey: 'solicitationId' })
    this.Solicitation.hasMany(this.FreightLetter, { as: 'freightLetters', foreignKey: 'solicitationId' })

    this.SolicitationStatusWorkflow.belongsTo(this.SolicitationStatus, { as: 'fromStatus', foreignKey: 'fromStatusId' })
    this.SolicitationStatusWorkflow.belongsTo(this.SolicitationStatus, { as: 'toStatus', foreignKey: 'toStatusId' })

    this.SolicitationStatusTipo.belongsTo(this.SolicitationStatus, { as: 'status', foreignKey: 'statusId' })
    this.SolicitationStatusTipo.belongsTo(this.SolicitationType, { as: 'type', foreignKey: 'typeId' })
    this.SolicitationStatus.hasMany(this.SolicitationStatusTipo, { as: 'statusTypes', foreignKey: 'statusId' })
    this.SolicitationType.hasMany(this.SolicitationStatusTipo, { as: 'statusTypes', foreignKey: 'typeId' })

    this.SolicitationProduct.belongsTo(this.Product, { as: 'product', foreignKey: 'itemId' })
    this.SolicitationService.belongsTo(this.Service, { as: 'service', foreignKey: 'itemId' })
    this.SolicitationFinance.belongsTo(this.Solicitation, { as: 'solicitation', foreignKey: 'solicitationId' })
    this.SolicitationProduct.belongsTo(this.Solicitation, { as: 'solicitation', foreignKey: 'solicitationId' })

    this.User.hasMany(this.CompanyUser, { as: 'companyUsers', foreignKey: 'userId' })
    this.User.belongsTo(this.UserMember, { as: 'userMember', foreignKey: 'userId', targetKey: 'userId' })

    this.Document.belongsTo(this.Partner, { as: 'partner', foreignKey: 'partnerId' })
    this.Document.belongsTo(this.Company, { as: 'company', foreignKey: 'companyId' })
    this.Document.belongsTo(this.Solicitation, { as: 'solicitation', foreignKey: 'solicitationId' })
    this.Document.belongsTo(this.DocumentType, { as: 'documentType', foreignKey: 'documentModelId' })
    this.Document.belongsTo(this.DocumentRequestType, { as: 'requestType', foreignKey: 'requestTypeId' })
    this.Document.belongsTo(this.FinanceTitle, { as: 'financeTitle', foreignKey: 'financeTitleId' })

    this.SolicitationDocument.belongsTo(this.Solicitation, { as: 'solicitation', foreignKey: 'solicitationId' })
    this.SolicitationDocument.belongsTo(this.Document, { as: 'document', foreignKey: 'documentId' })

    this.DocumentProduct.belongsTo(this.Document, { as: 'document', foreignKey: 'documentId' })
    this.DocumentProduct.belongsTo(this.Product, { as: 'product', foreignKey: 'itemId' })
    this.Document.hasMany(this.DocumentProduct, { as: 'items', foreignKey: 'documentId' })

    this.DocumentService.belongsTo(this.Document, { as: 'document', foreignKey: 'documentId' })
    this.DocumentService.belongsTo(this.Service, { as: 'service', foreignKey: 'itemId' })
    this.Document.hasMany(this.DocumentService, { as: 'services', foreignKey: 'documentId' })

    this.FinanceTitle.belongsTo(this.Partner, { as: 'partner', foreignKey: 'partnerId' })
    this.FinanceTitle.belongsTo(this.Company, { as: 'company', foreignKey: 'companyId' })
    this.FinanceTitle.belongsTo(this.FinanceTitle, { as: 'parent', foreignKey: 'parentMovementId' })

    this.FinanceTitle.hasMany(this.FinanceEntry, { as: 'entries', foreignKey: 'titleId' })
    this.FinanceEntry.belongsTo(this.FinanceTitle, { as: 'title', foreignKey: 'titleId' })
    this.FreightLetter.belongsTo(this.Partner, { as: 'payee', foreignKey: 'payeeId' })
    this.FreightLetter.belongsTo(this.FinanceTitle, { as: 'movement', foreignKey: 'movementId' })
    this.FreightLetter.belongsTo(this.Solicitation, { as: 'solicitation', foreignKey: 'solicitationId' })
    this.FreightLetter.belongsTo(this.FreightLetterComponentType, { as: 'componentType', foreignKey: 'freightLetterComponentTypeId' })

    /*
    this.Company.addHook('afterFind', afterFind)
    this.CompanyBusiness.addHook('afterFind', afterFind)
    this.CompanyUser.addHook('afterFind', afterFind)
    this.User.addHook('afterFind', afterFind)
    this.UserMember.addHook('afterFind', afterFind)
    this.SolicitationType.addHook('afterFind', afterFind)
    this.SolicitationRequestType.addHook('afterFind', afterFind)
    this.Solicitation.addHook('afterFind', afterFind)
    this.SolicitationStatus.addHook('afterFind', afterFind)
    this.SolicitationStatusWorkflow.addHook('afterFind', afterFind)
    this.SolicitationStatusTipo.addHook('afterFind', afterFind)
    this.SolicitationProduct.addHook('afterFind', afterFind)
    this.SolicitationService.addHook('afterFind', afterFind)
    this.SolicitationFinance.addHook('afterFind', afterFind)
    this.Product.addHook('afterFind', afterFind)
    this.Document.addHook('afterFind', afterFind)
    this.DocumentType.addHook('afterFind', afterFind)
    this.DocumentRequestType.addHook('afterFind', afterFind)
    this.DocumentProduct.addHook('afterFind', afterFind)
    this.DocumentService.addHook('afterFind', afterFind)
    this.FinanceTitle.addHook('afterFind', afterFind)
    this.FinanceEntry.addHook('afterFind', afterFind)
    this.SolicitationDocument.addHook('afterFind', afterFind)
    */

  }

  async withTransaction(transaction, callback) {

    if (transaction && typeof transaction.commit === 'function') {
      return await callback(transaction)
    }

    return await this.transaction(async (t) => {
      return await callback(t)
    })

  }

}