import { DataTypes } from 'sequelize';

export class Cte {
  id = {
    field: 'ID',
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.BIGINT
  }

  loadId = {
    field: 'IDCarga',
    type: DataTypes.BIGINT,
    allowNull: true
  }

  customerId = {
    field: 'IDCliente',
    type: DataTypes.BIGINT,
    allowNull: true
  }

  ctCode = {
    field: 'cCT',
    type: DataTypes.BIGINT,
    allowNull: true
  }

  batchNumber = {
    field: 'NumeroLote',
    type: DataTypes.BIGINT,
    allowNull: true
  }

  statusCode = {
    field: 'cStat',
    type: DataTypes.INTEGER,
    allowNull: true
  }

  ctSeries = {
    field: 'serieCT',
    type: DataTypes.TINYINT,
    allowNull: true
  }

  ctNumber = {
    field: 'nCT',
    type: DataTypes.BIGINT,
    allowNull: true
  }

  ctKey = {
    field: 'ChaveCt',
    type: DataTypes.STRING(44),
    allowNull: true
  }

  cteTypeId = {
    field: 'tpCTe',
    type: DataTypes.INTEGER,
    allowNull: true
  }

  reason = {
    field: 'xMotivo',
    type: DataTypes.STRING(255),
    allowNull: true
  }

  protocolNumber = {
    field: 'nProt',
    type: DataTypes.STRING(15),
    allowNull: true
  }

  receiptNumber = {
    field: 'nRec',
    type: DataTypes.STRING(15),
    allowNull: true
  }

  issuedAt = {
    field: 'dhEmi',
    type: DataTypes.DATE,
    allowNull: true
  }

  receivedAt = {
    field: 'dhRecbto',
    type: DataTypes.DATE,
    allowNull: true
  }

  taxBaseAmount = {
    field: 'baseCalculo',
    type: DataTypes.DECIMAL(19, 4),
    allowNull: true
  }

  icmsAmount = {
    field: 'valorIcms',
    type: DataTypes.DECIMAL(19, 4),
    allowNull: true
  }

  icmsPercentage = {
    field: 'pICMS',
    type: DataTypes.DECIMAL(18, 2),
    allowNull: true
  }

  complementedCteId = {
    field: 'IDCteComplementado',
    type: DataTypes.BIGINT,
    allowNull: true
  }

  complementedAmount = {
    field: 'ValorComplementado',
    type: DataTypes.DECIMAL(19, 4),
    allowNull: true
  }

  description = {
    field: 'Descricao',
    type: DataTypes.STRING(300),
    allowNull: true
  }

  cfop = {
    field: 'CFOP',
    type: DataTypes.INTEGER,
    allowNull: true
  }

  reducedTaxBasePercentage = {
    field: 'pRedBC',
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  }

  itemQuantity = {
    field: 'QuantidadeItem',
    type: DataTypes.DECIMAL(11, 4),
    allowNull: true
  }

  measurementType = {
    field: 'tipoMedida',
    type: DataTypes.STRING(20),
    allowNull: true
  }

  unitCode = {
    field: 'codigoUnidade',
    type: DataTypes.TINYINT,
    allowNull: true
  }

  predominatingProduct = {
    field: 'proPred',
    type: DataTypes.STRING(60),
    allowNull: true
  }

  otherCargoDescription = {
    field: 'xOutCat',
    type: DataTypes.STRING(30),
    allowNull: true
  }

  documentModelTypeId = {
    field: 'IDModeloCt',
    type: DataTypes.INTEGER,
    allowNull: true
  }

  movementId = {
    field: 'IDMovimento',
    type: DataTypes.BIGINT,
    allowNull: true
  }

  xml = {
    field: 'Xml',
    type: DataTypes.TEXT('long'),
    allowNull: true
  }

  insuranceProtocol = {
    field: 'SeguroProtocolo',
    type: DataTypes.STRING(40),
    allowNull: true
  }

  insuranceDescription = {
    field: 'SeguroDescricao',
    type: DataTypes.STRING(200),
    allowNull: true
  }

  originCityId = {
    field: 'Origem',
    type: DataTypes.INTEGER,
    allowNull: true
  }

  destinationCityId = {
    field: 'Destino',
    type: DataTypes.INTEGER,
    allowNull: true
  }

  receiptXml = {
    field: 'XmlRecibo',
    type: DataTypes.TEXT('long'),
    allowNull: true
  }

  cancelReceiptXml = {
    field: 'XmlReciboCancelamento',
    type: DataTypes.TEXT('long'),
    allowNull: true
  }

  cancelProtocolNumber = {
    field: 'nProtCancelamento',
    type: DataTypes.CHAR(15),
    allowNull: true
  }

  cancelReceivedAt = {
    field: 'dhRecbtoCancelamento',
    type: DataTypes.DATE,
    allowNull: true
  }

  shouldCancel = {
    field: 'Cancelar',
    type: DataTypes.BOOLEAN,
    allowNull: true
  }

  cancelXml = {
    field: 'XmlCancelamento',
    type: DataTypes.TEXT('long'),
    allowNull: true
  }

  cancelInsuranceProtocol = {
    field: 'SeguroProtocoloCancelamento',
    type: DataTypes.STRING(40),
    allowNull: true
  }

  loadGroupId = {
    field: 'IDCargaGrupo',
    type: DataTypes.BIGINT,
    allowNull: true
  }

  customerControlNumber = {
    field: 'NumeroControleCliente',
    type: DataTypes.INTEGER,
    allowNull: true
  }

  migrationId = {
    field: 'IDMigracao',
    type: DataTypes.INTEGER,
    allowNull: true
  }

  xrefMasterMaq = {
    field: 'XrefMasterMaq',
    type: DataTypes.INTEGER,
    allowNull: true
  }

  fileLink = {
    field: 'LinkArquivo',
    type: DataTypes.STRING(200),
    allowNull: true
  }

  cteAdditionalFeaturesId = {
    field: 'IDCtexCaracAd',
    type: DataTypes.INTEGER,
    allowNull: true
  }

  taxInfo = {
    field: 'infAdFisco',
    type: DataTypes.STRING(2000),
    allowNull: true
  }

  creditValue = {
    field: 'vCred',
    type: DataTypes.DECIMAL(19, 4),
    allowNull: true
  }

  cstId = {
    field: 'CST',
    type: DataTypes.INTEGER,
    allowNull: true
  }

  isCourtesy = {
    field: 'isCortesia',
    type: DataTypes.BOOLEAN,
    allowNull: true
  }

  cteStatusAtCompanyId = {
    field: 'IDCteStatusNaEmpresa',
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 1
  }

  cteStatusAtCompanyReason = {
    field: 'xMotivoCteStatusNaEmpresa',
    type: DataTypes.STRING(200),
    allowNull: true
  }

  replacedCteId = {
    field: 'IDCteSubstituido',
    type: DataTypes.BIGINT,
    allowNull: true
  }

  annulmentNfeKey = {
    field: 'chaveNfeAnulacao',
    type: DataTypes.STRING(44),
    allowNull: true
  }

  amountToReceive = {
    field: 'valorAReceber',
    type: DataTypes.DECIMAL(19, 4),
    allowNull: true
  }

  totalServiceAmount = {
    field: 'vTPrest',
    type: DataTypes.DECIMAL(19, 4),
    allowNull: true
  }

  cteTypeAtCompanyId = {
    field: 'idCteTipoNaEmpresa',
    type: DataTypes.INTEGER,
    allowNull: true
  }

  tripId = {
    field: 'IdViagem',
    type: DataTypes.BIGINT,
    allowNull: true
  }

  qrCode = {
    field: 'qrCodCTe',
    type: DataTypes.STRING(1000),
    allowNull: true
  }

  annulledCteId = {
    field: 'IdCteAnulado',
    type: DataTypes.BIGINT,
    allowNull: true
  }

  annulledDocumentIssuedAt = {
    field: 'dhEmiDocAnulado',
    type: DataTypes.DATE,
    allowNull: true
  }

  payerId = {
    field: 'IdTomador',
    type: DataTypes.BIGINT,
    allowNull: true
  }

  password = {
    field: 'Senha',
    type: DataTypes.STRING(10),
    allowNull: true
  }

  customerControlNumber2 = {
    field: 'NumeroControleCliente2',
    type: DataTypes.STRING(20),
    allowNull: true
  }

  icmsCredit = {
    field: 'CreditoICMS',
    type: DataTypes.DECIMAL(18, 2),
    allowNull: true
  }

  senderId = {
    field: 'senderId',
    type: DataTypes.BIGINT,
    allowNull: true
  }

  dispatcherId = {
    field: 'dispatcherId',
    type: DataTypes.BIGINT,
    allowNull: true
  }

  receiverId = {
    field: 'receiverId',
    type: DataTypes.BIGINT,
    allowNull: true
  }

  companyBranchId = {
    field: 'IDEmpresaFilial',
    type: DataTypes.TINYINT,
    allowNull: true
  }

  proofLink = {
    field: 'LinkComprovante',
    type: DataTypes.STRING(200),
    allowNull: true
  }

  proofUploadedAt = {
    field: 'DataUploadComprovante',
    type: DataTypes.DATE,
    allowNull: true
  }

  responsibleId = {
    field: 'IDResponsavel',
    type: DataTypes.UUID,
    allowNull: true
  }

  operatorArrivalAt = {
    field: 'DataChegadaOperador',
    type: DataTypes.DATE,
    allowNull: true
  }

  operatorDeliveredAt = {
    field: 'DataEntregueOperador',
    type: DataTypes.DATE,
    allowNull: true
  }

  additionalTaxInfo = {
    field: 'infoAdFisco',
    type: DataTypes.STRING(500),
    allowNull: true
  }

  ibsCbsCst = {
    field: 'IBSCBSCST',
    type: DataTypes.STRING(3),
    allowNull: true
  }

  ibsCbsTaxClass = {
    field: 'IBSCBSClassTrib',
    type: DataTypes.STRING(6),
    allowNull: true
  }

  ibsPercentage = {
    field: 'pIBS',
    type: DataTypes.DECIMAL(18, 2),
    allowNull: true
  }

  cbsPercentage = {
    field: 'pCBS',
    type: DataTypes.DECIMAL(18, 2),
    allowNull: true
  }

  ibsAmount = {
    field: 'vIBS',
    type: DataTypes.DECIMAL(18, 2),
    allowNull: true
  }

  cbsAmount = {
    field: 'vCBS',
    type: DataTypes.DECIMAL(18, 2),
    allowNull: true
  }
}
