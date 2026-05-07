import { DataTypes } from 'sequelize';

export class CashClosureHistory {
  id = {
    field: 'Id',
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.INTEGER
  }

  date = {
    field: 'Data',
    type: DataTypes.DATE,
    allowNull: false
  }

  description = {
    field: 'Descricao',
    type: DataTypes.STRING(300),
    allowNull: false
  }

  statusId = {
    field: 'IdStatus',
    type: DataTypes.INTEGER,
    allowNull: false
  }

  userId = {
    field: 'UserId',
    type: DataTypes.UUID,
    allowNull: false
  }

  cashClosureId = {
    field: 'IdCaixaFechamento',
    type: DataTypes.INTEGER,
    allowNull: false
  }
}
