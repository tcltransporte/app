import { DataTypes } from 'sequelize';

export class FinanceTitle {

  id = {
    field: 'codigo_movimento',
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.BIGINT
  }

  partnerId = {
    field: 'codigo_pessoa',
    type: DataTypes.BIGINT,
    allowNull: false
  }

  documentNumber = {
    field: 'numero_documento',
    type: DataTypes.INTEGER,
    allowNull: false
  }

  totalValue = {
    field: 'valor_total',
    type: DataTypes.DECIMAL(19, 4),
    allowNull: false
  }

  movementDate = {
    field: 'data_movimento',
    type: DataTypes.DATE,
    allowNull: false
  }

  description = {
    field: 'descricao',
    type: DataTypes.STRING(1000),
    allowNull: true
  }

  accountId = {
    field: 'codigo_conta',
    type: DataTypes.SMALLINT,
    allowNull: true
  }

  companyId = {
    field: 'CodigoEmpresaFilial',
    type: DataTypes.TINYINT,
    allowNull: true
  }

  costCenterId = {
    field: 'IDCentroCusto',
    type: DataTypes.INTEGER,
    allowNull: true
  }

  parentMovementId = {
    field: 'IDMovimentoPai',
    type: DataTypes.BIGINT,
    allowNull: true
  }

  invoiceId = {
    field: 'IDFatura',
    type: DataTypes.BIGINT,
    allowNull: true
  }

  issueDate = {
    field: 'dataEmissao',
    type: DataTypes.DATE,
    allowNull: true
  }

  accountPlanId = {
    field: 'IDPlanoContasContabil',
    type: DataTypes.INTEGER,
    allowNull: true
  }

  updatedAt = {
    field: 'DataUpdate',
    type: DataTypes.DATE,
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

  externalId = {
    field: 'externalId',
    type: DataTypes.STRING(15),
    allowNull: true
  }

  operationType = {
    field: 'type_operation',
    type: DataTypes.SMALLINT,
    allowNull: true
  }

  discountValue = {
    field: 'valor_desconto',
    type: DataTypes.DECIMAL(18, 2),
    allowNull: true
  }
}
