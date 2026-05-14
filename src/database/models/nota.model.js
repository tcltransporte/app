import { DataTypes } from 'sequelize'

/** Tabela `nota` — documento/nota vinculável a CT-e e parceiros. */
export class Nota {
  id = {
    field: 'codigo_nota',
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.BIGINT
  }

  loadId = {
    field: 'codigo_carga',
    type: DataTypes.BIGINT,
    allowNull: true
  }

  customerId = {
    field: 'codigo_cliente',
    type: DataTypes.BIGINT,
    allowNull: false
  }

  number = {
    field: 'numero',
    type: DataTypes.INTEGER,
    allowNull: true
  }

  orderNumber = {
    field: 'numero_pedido',
    type: DataTypes.INTEGER,
    allowNull: true
  }

  quantity = {
    field: 'quantidade',
    type: DataTypes.INTEGER,
    allowNull: true
  }

  unitId = {
    field: 'codigo_unidade',
    type: DataTypes.INTEGER,
    allowNull: true
  }

  weight = {
    field: 'peso',
    type: DataTypes.DECIMAL(18, 3),
    allowNull: true
  }

  amount = {
    field: 'valor',
    type: DataTypes.DECIMAL(19, 4),
    allowNull: true
  }

  deliveryAt = {
    field: 'data_entrega',
    type: DataTypes.DATE,
    allowNull: true
  }

  issuedAt = {
    field: 'data_emissao',
    type: DataTypes.DATE,
    allowNull: true
  }

  nfKey = {
    field: 'chaveNf',
    type: DataTypes.STRING(46),
    allowNull: true
  }

  pin = {
    field: 'PIN',
    type: DataTypes.INTEGER,
    allowNull: true
  }

  series = {
    field: 'serie',
    type: DataTypes.CHAR(3),
    allowNull: true
  }

  icmsBaseAmount = {
    field: 'vBC',
    type: DataTypes.DECIMAL(19, 4),
    allowNull: true
  }

  icmsAmount = {
    field: 'vICMS',
    type: DataTypes.DECIMAL(19, 4),
    allowNull: true
  }

  icmsStBaseAmount = {
    field: 'vBCST',
    type: DataTypes.DECIMAL(19, 4),
    allowNull: true
  }

  icmsStAmount = {
    field: 'vST',
    type: DataTypes.DECIMAL(19, 4),
    allowNull: true
  }

  cfop = {
    field: 'nCFOP',
    type: DataTypes.INTEGER,
    allowNull: true
  }

  measurementType = {
    field: 'tipoMedida',
    type: DataTypes.STRING(20),
    allowNull: true
  }

  productAmount = {
    field: 'vProd',
    type: DataTypes.DECIMAL(19, 4),
    allowNull: true
  }

  cteId = {
    field: 'IDCte',
    type: DataTypes.BIGINT,
    allowNull: true
  }

  receiverName = {
    field: 'Recebedor',
    type: DataTypes.STRING(60),
    allowNull: true
  }

  receiverDocument = {
    field: 'DocumentoRecebedor',
    type: DataTypes.STRING(30),
    allowNull: true
  }

  documentType = {
    field: 'TipoDocumento',
    type: DataTypes.TINYINT,
    allowNull: true
  }

  description = {
    field: 'Descricao',
    type: DataTypes.STRING(200),
    allowNull: true
  }

  documentModelTypeId = {
    field: 'IDTipoDocumento',
    type: DataTypes.INTEGER,
    allowNull: true
  }

  isPallet = {
    field: 'IsPalete',
    type: DataTypes.BOOLEAN,
    allowNull: true
  }

  deliveryId = {
    field: 'IDEntrega',
    type: DataTypes.BIGINT,
    allowNull: true
  }

  senderId = {
    field: 'IDRemetente',
    type: DataTypes.BIGINT,
    allowNull: true
  }

  fileLink = {
    field: 'LinkArquivo',
    type: DataTypes.STRING(200),
    allowNull: true
  }

  fileUploadedAt = {
    field: 'DataUploadArquivo',
    type: DataTypes.DATE,
    allowNull: true
  }

  transportDocumentId = {
    field: 'DocumentoTransporte',
    type: DataTypes.BIGINT,
    allowNull: true
  }

  maxExitAt = {
    field: 'DataLimiteSaida',
    type: DataTypes.DATE,
    allowNull: true
  }

  estimatedExitAt = {
    field: 'DataPrevisaoSaida',
    type: DataTypes.DATE,
    allowNull: true
  }

  leadTimeAt = {
    field: 'DataLeadTime',
    type: DataTypes.DATE,
    allowNull: true
  }

  customerScheduledAt = {
    field: 'DataAgendamentoCliente',
    type: DataTypes.DATE,
    allowNull: true
  }

  loadOrderId = {
    field: 'IdCargaOrdem',
    type: DataTypes.BIGINT,
    allowNull: true
  }

  lastValidShipmentNoteStatusId = {
    field: 'IdUltNotaStatusValidoCargas',
    type: DataTypes.BIGINT,
    allowNull: true
  }

  lastNoteStatusId = {
    field: 'IdUltNotaStatus',
    type: DataTypes.BIGINT,
    allowNull: true
  }

  customerRescheduledAt = {
    field: 'DataReagendamentoCliente',
    type: DataTypes.DATE,
    allowNull: true
  }

  customerArrivedAt = {
    field: 'DataChegadaCliente',
    type: DataTypes.DATE,
    allowNull: true
  }

  cubicVolume = {
    field: 'Cubagem',
    type: DataTypes.DECIMAL(18, 3),
    allowNull: true
  }
}
