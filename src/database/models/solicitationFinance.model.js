import { DataTypes } from 'sequelize';

export class SolicitationFinance {

  id = {
    field: 'ID',
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.INTEGER
  }

  solicitationId = {
    field: 'IDSolicitacao',
    type: DataTypes.INTEGER,
    allowNull: false
  }

  documentNumber = {
    field: 'NumeroDocumento',
    type: DataTypes.STRING(50),
    allowNull: true
  }

  dueDate = {
    field: 'DataVencimento',
    type: DataTypes.DATEONLY,
    allowNull: false
  }

  issueDate = {
    field: 'DataEmissao',
    type: DataTypes.DATE,
    allowNull: true
  }

  costCenterId = {
    field: 'IDCentroCusto',
    type: DataTypes.INTEGER,
    allowNull: true
  }

  value = {
    field: 'Valor',
    type: DataTypes.DECIMAL(19, 4),
    allowNull: false
  }

  description = {
    field: 'Descricao',
    type: DataTypes.TEXT,
    allowNull: true
  }

  installment = {
    field: 'Parcela',
    type: DataTypes.INTEGER,
    allowNull: true
  }

}
