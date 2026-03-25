import { DataTypes } from 'sequelize';

export class DocumentService {
  id = {
    field: 'ID',
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.BIGINT
  }

  itemId = {
    field: 'IDServico',
    allowNull: true,
    type: DataTypes.INTEGER
  }

  documentId = {
    field: 'IDCompras',
    allowNull: true,
    type: DataTypes.BIGINT
  }

  value = {
    field: 'Valor',
    allowNull: false,
    type: DataTypes.DECIMAL(19, 4)
  }

  quantity = {
    field: 'Quantidade',
    allowNull: false,
    type: DataTypes.DECIMAL(18, 4)
  }

  discount = {
    field: 'Desconto',
    allowNull: true,
    type: DataTypes.DECIMAL(19, 4)
  }

  icmsBase = {
    field: 'BaseIcms',
    allowNull: true,
    type: DataTypes.DECIMAL(19, 4)
  }

  stBase = {
    field: 'BaseST',
    allowNull: true,
    type: DataTypes.DECIMAL(19, 4)
  }

  icmsRate = {
    field: 'AliquotaIcms',
    allowNull: true,
    type: DataTypes.DECIMAL(18, 2)
  }

  stValue = {
    field: 'ValorST',
    allowNull: true,
    type: DataTypes.DECIMAL(19, 4)
  }

  ipiValue = {
    field: 'ValorIpi',
    allowNull: true,
    type: DataTypes.DECIMAL(19, 4)
  }

  cstaId = {
    field: 'IDCSTA',
    allowNull: true,
    type: DataTypes.INTEGER
  }

  cstbId = {
    field: 'IDCSTB',
    allowNull: true,
    type: DataTypes.INTEGER
  }

  order = {
    field: 'Ordem',
    allowNull: true,
    type: DataTypes.INTEGER
  }

  stockMovementCode = {
    field: 'codigo_movimento_estoque',
    allowNull: true,
    type: DataTypes.BIGINT
  }

  cfopId = {
    field: 'IDCFOP',
    allowNull: true,
    type: DataTypes.INTEGER
  }

  ipiRate = {
    field: 'AliquotaIpi',
    allowNull: true,
    type: DataTypes.DECIMAL(18, 2)
  }

  issBase = {
    field: 'BaseISS',
    allowNull: true,
    type: DataTypes.DECIMAL(19, 4)
  }

  issRate = {
    field: 'AliquotaISS',
    allowNull: true,
    type: DataTypes.DECIMAL(18, 2)
  }

  description = {
    field: 'Descricao',
    allowNull: true,
    type: DataTypes.STRING(500)
  }

  cofinsValue = {
    field: 'ValorCOFINS',
    allowNull: true,
    type: DataTypes.DECIMAL(19, 4)
  }

  pisBase = {
    field: 'BasePIS',
    allowNull: true,
    type: DataTypes.DECIMAL(19, 4)
  }

  pisRate = {
    field: 'AliquotaPIS',
    allowNull: true,
    type: DataTypes.DECIMAL(5, 2)
  }

  pisValue = {
    field: 'ValorPIS',
    allowNull: true,
    type: DataTypes.DECIMAL(19, 4)
  }

  cofinsBase = {
    field: 'BaseCOFINS',
    allowNull: true,
    type: DataTypes.DECIMAL(19, 4)
  }

  cofinsRate = {
    field: 'AliquotaCOFINS',
    allowNull: true,
    type: DataTypes.DECIMAL(5, 2)
  }

  issqnValue = {
    field: 'ValorISSQN',
    allowNull: true,
    type: DataTypes.DECIMAL(19, 4)
  }

  purchaseOrderId = {
    field: 'IDPedidoCompra',
    allowNull: true,
    type: DataTypes.INTEGER
  }

  cstPisCofinsId = {
    field: 'IDCSTPisConfins',
    allowNull: true,
    type: DataTypes.INTEGER
  }

  supplierItemId = {
    field: 'IDItemDoFornecedor',
    allowNull: true,
    type: DataTypes.STRING(60)
  }

  accountingPlanId = {
    field: 'IDPlanoContabil',
    allowNull: true,
    type: DataTypes.INTEGER
  }

  costCenterId = {
    field: 'IdCentroCusto',
    allowNull: true,
    type: DataTypes.INTEGER
  }

  solicitationPaymentId = {
    field: 'IDSolicitacoPagamento',
    allowNull: true,
    type: DataTypes.INTEGER
  }
}
