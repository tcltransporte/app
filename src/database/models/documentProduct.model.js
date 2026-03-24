import { DataTypes } from 'sequelize';

export class DocumentProduct {
  id = {
    field: 'ID',
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.BIGINT
  }

  itemId = {
    field: 'IDItem',
    allowNull: true,
    type: DataTypes.BIGINT
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

  description = {
    field: 'Descricao',
    allowNull: true,
    type: DataTypes.STRING(500)
  }

  ncm = {
    field: 'NCM',
    allowNull: true,
    type: DataTypes.CHAR(20)
  }

  icmsValue = {
    field: 'ValorICMS',
    allowNull: true,
    type: DataTypes.DECIMAL(19, 4)
  }

  icmsReductionRate = {
    field: 'AliquotaRedBCICMS',
    allowNull: true,
    type: DataTypes.DECIMAL(5, 2)
  }

  stRate = {
    field: 'AliquotaST',
    allowNull: true,
    type: DataTypes.DECIMAL(5, 2)
  }

  stUf = {
    field: 'UfICMSSTDeviso',
    allowNull: true,
    type: DataTypes.CHAR(2)
  }

  cstIpiId = {
    field: 'IDCSTIPI',
    allowNull: true,
    type: DataTypes.INTEGER
  }

  ipiEnquadramentoCode = {
    field: 'IPICodigoEnquadramento',
    allowNull: true,
    type: DataTypes.INTEGER
  }

  ipiBase = {
    field: 'BaseIPI',
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

  cofinsValue = {
    field: 'ValorCOFINS',
    allowNull: true,
    type: DataTypes.DECIMAL(19, 4)
  }

  icmsstRate = {
    field: 'AliquotaICMSST',
    allowNull: true,
    type: DataTypes.DECIMAL(5, 2)
  }

  unitId = {
    field: 'IDUnidade',
    allowNull: true,
    type: DataTypes.INTEGER
  }

  supplierItemId = {
    field: 'IDItemDoFornecedor',
    allowNull: true,
    type: DataTypes.STRING(60)
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

  stockMovementId = {
    field: 'IdMovimentoEstoque',
    allowNull: true,
    type: DataTypes.BIGINT
  }

  accountingPlanId = {
    field: 'IDPlanoContabil',
    allowNull: true,
    type: DataTypes.INTEGER
  }

  inputUnitStockItemId = {
    field: 'IdItemEstoqueUnidadeEntrada',
    allowNull: true,
    type: DataTypes.INTEGER
  }

  accountingSubCategoryId = {
    field: 'IdPlanoContasContabilSubCategoria',
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
