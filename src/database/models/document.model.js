import { DataTypes } from 'sequelize';

export class Document {
  id = {
    field: 'ID',
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.BIGINT
  }

  partnerId = {
    field: 'IDFornecedor',
    allowNull: false,
    type: DataTypes.BIGINT
  }

  invoiceNumber = {
    field: 'NumeroNF',
    allowNull: false,
    type: DataTypes.BIGINT
  }

  invoiceDate = {
    field: 'DataNF',
    allowNull: false,
    type: DataTypes.DATE
  }

  receiptDate = {
    field: 'DataEntrada',
    allowNull: true,
    type: DataTypes.DATE
  }

  invoiceSerie = {
    field: 'SerieNF',
    allowNull: true,
    type: DataTypes.CHAR(30)
  }

  documentModelId = {
    field: 'IDModeloDocumento',
    allowNull: true,
    type: DataTypes.INTEGER
  }

  isFinancialRealized = {
    field: 'RealizadoFinanceiro',
    allowNull: true,
    type: DataTypes.BOOLEAN
  }

  solicitationId = {
    field: 'IDSolicitacao',
    allowNull: true,
    type: DataTypes.BIGINT
  }

  invoiceValue = {
    field: 'valorNF',
    allowNull: false,
    type: DataTypes.DECIMAL(19, 4)
  }

  companyId = {
    field: 'IDEmpresa',
    allowNull: false,
    type: DataTypes.INTEGER
  }

  cfopId = {
    field: 'IDCFOP',
    allowNull: true,
    type: DataTypes.INTEGER
  }

  cfopDetailId = {
    field: 'IDCFOPDetalhe',
    allowNull: true,
    type: DataTypes.INTEGER
  }

  invoiceKey = {
    field: 'ChaveNfe',
    allowNull: true,
    type: DataTypes.STRING(60)
  }

  financeTitleId = {
    field: 'IDMovimento',
    allowNull: true,
    type: DataTypes.BIGINT
  }

  paymentConditionId = {
    field: 'IDCondicaoPagamento',
    allowNull: true,
    type: DataTypes.INTEGER
  }

  cashierDate = {
    field: 'CXAData',
    allowNull: true,
    type: DataTypes.DATE
  }

  cashierValue = {
    field: 'CXAValor',
    allowNull: true,
    type: DataTypes.DECIMAL(19, 4)
  }

  cashierHistoryCode = {
    field: 'CXAHistC',
    allowNull: true,
    type: DataTypes.CHAR(10)
  }

  cashierHistory = {
    field: 'CXAHist',
    allowNull: true,
    type: DataTypes.STRING(50)
  }

  documentTypeId = {
    field: 'IDTipoDocumento',
    allowNull: true,
    type: DataTypes.INTEGER
  }

  freightValue = {
    field: 'ValorFrete',
    allowNull: true,
    type: DataTypes.DECIMAL(19, 4)
  }

  insuranceValue = {
    field: 'ValorSeguro',
    allowNull: true,
    type: DataTypes.DECIMAL(19, 4)
  }

  otherValues = {
    field: 'ValorOutras',
    allowNull: true,
    type: DataTypes.DECIMAL(19, 4)
  }

  hasFreight = {
    field: 'INDFrete',
    allowNull: true,
    type: DataTypes.BOOLEAN
  }

  hasInsurance = {
    field: 'INDSeguro',
    allowNull: true,
    type: DataTypes.BOOLEAN
  }

  hasOtherValues = {
    field: 'INDOutras',
    allowNull: true,
    type: DataTypes.BOOLEAN
  }

  discountValue = {
    field: 'ValorDesconto',
    allowNull: true,
    type: DataTypes.DECIMAL(19, 4)
  }

  totalProductsValue = {
    field: 'ValorTotalProdutos',
    allowNull: true,
    type: DataTypes.DECIMAL(19, 4)
  }

  icmsBaseValue = {
    field: 'ValorBCIcms',
    allowNull: true,
    type: DataTypes.DECIMAL(19, 4)
  }

  icmsValue = {
    field: 'ValorIcms',
    allowNull: true,
    type: DataTypes.DECIMAL(19, 4)
  }

  ipiValue = {
    field: 'ValorIPI',
    allowNull: true,
    type: DataTypes.DECIMAL(19, 4)
  }

  iiValue = {
    field: 'ValorII',
    allowNull: true,
    type: DataTypes.DECIMAL(19, 4)
  }

  pisValue = {
    field: 'ValorPIS',
    allowNull: true,
    type: DataTypes.DECIMAL(19, 4)
  }

  cofinsValue = {
    field: 'ValorConfins',
    allowNull: true,
    type: DataTypes.DECIMAL(19, 4)
  }

  icmsstBaseValue = {
    field: 'ValorBCST',
    allowNull: true,
    type: DataTypes.DECIMAL(19, 4)
  }

  icmsstValue = {
    field: 'ValorICMSST',
    allowNull: true,
    type: DataTypes.DECIMAL(19, 4)
  }

  invoiceTypeId = {
    field: 'IDTipoNotaFiscal',
    allowNull: true,
    type: DataTypes.INTEGER
  }

  branchCode = {
    field: 'CodigoEmpresaFilial',
    allowNull: true,
    type: DataTypes.TINYINT
  }

  freightTypeId = {
    field: 'IDTipoFrete',
    allowNull: true,
    type: DataTypes.INTEGER
  }

  description = {
    field: 'Descricao',
    allowNull: true,
    type: DataTypes.STRING(500)
  }

  masterMachineXref = {
    field: 'XrefMasterMaq',
    allowNull: true,
    type: DataTypes.INTEGER
  }

  irrfValue = {
    field: 'ValorIRRF',
    allowNull: true,
    type: DataTypes.DECIMAL(19, 4)
  }

  inssValue = {
    field: 'ValorINSS',
    allowNull: true,
    type: DataTypes.DECIMAL(19, 4)
  }

  issValue = {
    field: 'ValorISS',
    allowNull: true,
    type: DataTypes.DECIMAL(19, 4)
  }

  isSpedPisCofins = {
    field: 'IsSpedPisConfis',
    allowNull: true,
    type: DataTypes.BOOLEAN
  }

  isFiscalIntegration = {
    field: 'IsIntegraFiscal',
    allowNull: true,
    type: DataTypes.BOOLEAN
  }

  isStockConciliated = {
    field: 'IsConciliadaEstoque',
    allowNull: true,
    type: DataTypes.BOOLEAN
  }

  isAccountantChecked = {
    field: 'IsCheckContabil',
    allowNull: true,
    type: DataTypes.BOOLEAN
  }

  isCouponConciliated = {
    field: 'IsConciliarCupom',
    allowNull: true,
    type: DataTypes.BOOLEAN
  }

  accountingPlanId = {
    field: 'IDPlanoContabil',
    allowNull: true,
    type: DataTypes.INTEGER
  }

  fileLink = {
    field: 'linkArquivo',
    allowNull: true,
    type: DataTypes.STRING(300)
  }

  chartOfAccountsId = {
    field: 'idPlanoConta',
    allowNull: true,
    type: DataTypes.SMALLINT
  }

  systemDate = {
    field: 'dataSistema',
    allowNull: true,
    type: DataTypes.DATE
  }

  createdById = {
    field: 'UserIdInsert',
    allowNull: true,
    type: DataTypes.UUID
  }

  createdAt = {
    field: 'DataInsert',
    allowNull: true,
    type: DataTypes.DATE
  }

  updatedById = {
    field: 'UserIdUpdate',
    allowNull: true,
    type: DataTypes.UUID
  }

  updatedAt = {
    field: 'DataUpdate',
    allowNull: true,
    type: DataTypes.DATE
  }

  costCenterId = {
    field: 'IdCentroCusto',
    allowNull: true,
    type: DataTypes.INTEGER
  }

  lastPurchaseStatusId = {
    field: 'IdUltComprasStatus',
    allowNull: true,
    type: DataTypes.BIGINT
  }

  isFinancialChecked = {
    field: 'IsCheckFinanceiro',
    allowNull: true,
    type: DataTypes.BOOLEAN
  }

  isBuyerChecked = {
    field: 'IsCheckQuemComprou',
    allowNull: true,
    type: DataTypes.BOOLEAN
  }

  isManuallyAdded = {
    field: 'IsAdicionadaManual',
    allowNull: true,
    type: DataTypes.BOOLEAN
  }

  status = {
    field: 'status',
    allowNull: true,
    type: DataTypes.INTEGER
  }

  reason = {
    field: 'reason',
    allowNull: true,
    type: DataTypes.STRING(500)
  }

  issqnPercentage = {
    field: 'pISSQN',
    allowNull: true,
    type: DataTypes.DECIMAL(18, 2)
  }

  nfseOperationId = {
    field: 'nfseOperationId',
    allowNull: true,
    type: DataTypes.UUID
  }

  nfseIssqnId = {
    field: 'nfseIssqnId',
    allowNull: true,
    type: DataTypes.SMALLINT
  }

  nfseRetentionId = {
    field: 'nfseRetentionId',
    allowNull: true,
    type: DataTypes.SMALLINT
  }

  purchaseDiscountId = {
    field: 'IDCompraDesconto',
    allowNull: true,
    type: DataTypes.BIGINT
  }
}
