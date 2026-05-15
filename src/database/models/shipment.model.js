import { DataTypes } from 'sequelize'

/**
 * Tabela `dbo.carga` — romaneio / shipment (legado GlobalTCL).
 * Vinculada a viagem, clientes (pessoa), CT-e, notas e carta frete.
 */
export class Shipment {
  id = {
    field: 'codigo_carga',
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.BIGINT
  }

  tripId = {
    field: 'codigo_viagem',
    type: DataTypes.BIGINT,
    allowNull: true
  }

  customerId = {
    field: 'codigo_cliente',
    type: DataTypes.BIGINT,
    allowNull: false
  }

  transportDocumentId = {
    field: 'documento_transporte',
    type: DataTypes.BIGINT,
    allowNull: true
  }

  deliveryQuantity = {
    field: 'quantidade_entrega',
    type: DataTypes.INTEGER,
    allowNull: true
  }

  weight = {
    field: 'peso',
    type: DataTypes.DECIMAL(18, 2),
    allowNull: true
  }

  freightValue = {
    field: 'valor_frete',
    type: DataTypes.DECIMAL(19, 4),
    allowNull: true
  }

  description = {
    field: 'descricao',
    type: DataTypes.STRING(60),
    allowNull: true
  }

  loadTypeId = {
    field: 'codigo_tipo_carga',
    type: DataTypes.INTEGER,
    allowNull: true
  }

  departureDate = {
    field: 'data_saida',
    type: DataTypes.DATE,
    allowNull: true
  }

  serviceTypeId = {
    field: 'TipoServico',
    type: DataTypes.INTEGER,
    allowNull: true
  }

  servicePayerTypeId = {
    field: 'TomadorServico',
    type: DataTypes.INTEGER,
    allowNull: true
  }

  paymentTypeId = {
    field: 'forPag',
    type: DataTypes.INTEGER,
    allowNull: true
  }

  companyBranchId = {
    field: 'CodigoEmpresaFilial',
    type: DataTypes.TINYINT,
    allowNull: true
  }

  deliveryDate = {
    field: 'dataEntrega',
    type: DataTypes.DATE,
    allowNull: true
  }

  proPred = {
    field: 'proPred',
    type: DataTypes.STRING(60),
    allowNull: true
  }

  fullLoad = {
    field: 'Lota',
    type: DataTypes.BOOLEAN,
    allowNull: true
  }

  receiverId = {
    field: 'IDRecebedor',
    type: DataTypes.BIGINT,
    allowNull: true
  }

  expediterId = {
    field: 'IDExpedidor',
    type: DataTypes.BIGINT,
    allowNull: true
  }

  thirdPartyPayerId = {
    field: 'IDTomadorOutros',
    type: DataTypes.BIGINT,
    allowNull: true
  }

  freightLetterValue = {
    field: 'ValorCartaFrete',
    type: DataTypes.DECIMAL(19, 4),
    allowNull: true
  }

  isValid = {
    field: 'IsValida',
    type: DataTypes.BOOLEAN,
    allowNull: true
  }

  icmsCalculationTypeId = {
    field: 'IDTipoCalculoIcms',
    type: DataTypes.INTEGER,
    allowNull: true
  }

  cteModalId = {
    field: 'IDCteModal',
    type: DataTypes.INTEGER,
    allowNull: true
  }

  retira = {
    field: 'retira',
    type: DataTypes.BOOLEAN,
    allowNull: true
  }

  detRetiraDetail = {
    field: 'xDetRetira',
    type: DataTypes.STRING(160),
    allowNull: true
  }

  itemQuantity = {
    field: 'QuantidadeItem',
    type: DataTypes.DECIMAL(11, 4),
    allowNull: true
  }

  measureType = {
    field: 'tipoMedida',
    type: DataTypes.STRING(20),
    allowNull: true
  }

  unitCode = {
    field: 'codigoUnidade',
    type: DataTypes.TINYINT,
    allowNull: true
  }

  outCat = {
    field: 'xOutCat',
    type: DataTypes.STRING(30),
    allowNull: true
  }

  broker = {
    field: 'Agenciador',
    type: DataTypes.STRING(50),
    allowNull: true
  }

  nMinu = {
    field: 'nMinu',
    type: DataTypes.CHAR(9),
    allowNull: true
  }

  nOCA = {
    field: 'nOCA',
    type: DataTypes.CHAR(14),
    allowNull: true
  }

  xDime = {
    field: 'xDime',
    type: DataTypes.CHAR(14),
    allowNull: true
  }

  cteClassId = {
    field: 'IDCteClasse',
    type: DataTypes.INTEGER,
    allowNull: true
  }

  cTar = {
    field: 'cTar',
    type: DataTypes.CHAR(4),
    allowNull: true
  }

  vTar = {
    field: 'vTar',
    type: DataTypes.DECIMAL(19, 4),
    allowNull: true
  }

  freightTableDetailId = {
    field: 'IDTabelaFreteDetalhe',
    type: DataTypes.BIGINT,
    allowNull: true
  }

  cardOperatorProtocol = {
    field: 'ProtocoloOperadoraCartao',
    type: DataTypes.CHAR(10),
    allowNull: true
  }

  originMunicipalityId = {
    field: 'IDOrigem',
    type: DataTypes.INTEGER,
    allowNull: true
  }

  destinationMunicipalityId = {
    field: 'IDDestino',
    type: DataTypes.INTEGER,
    allowNull: true
  }

  sequenceOrder = {
    field: 'Ordem',
    type: DataTypes.INTEGER,
    allowNull: true
  }

  cargoTypeId = {
    field: 'IDCargaTipo',
    type: DataTypes.INTEGER,
    allowNull: true
  }

  refCteKey = {
    field: 'refCte',
    type: DataTypes.CHAR(44),
    allowNull: true
  }

  occurrenceNumber = {
    field: 'numeroOcorrencia',
    type: DataTypes.BIGINT,
    allowNull: true
  }

  tripGroupId = {
    field: 'idViagemGrupo',
    type: DataTypes.BIGINT,
    allowNull: true
  }

  insertUserId = {
    field: 'UserIdInsert',
    type: DataTypes.UUID,
    allowNull: true
  }

  insertedAt = {
    field: 'DataInsert',
    type: DataTypes.DATE,
    allowNull: true
  }

  updateUserId = {
    field: 'UserIdUpdate',
    type: DataTypes.UUID,
    allowNull: true
  }

  updatedAt = {
    field: 'DataUpdate',
    type: DataTypes.DATE,
    allowNull: true
  }

  observation = {
    field: 'Observacao',
    type: DataTypes.STRING(300),
    allowNull: true
  }

  ncmId = {
    field: 'IDNCM',
    type: DataTypes.INTEGER,
    allowNull: true
  }
}
