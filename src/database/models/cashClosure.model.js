import { DataTypes } from 'sequelize';

export class CashClosure {
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

  statusId = {
    field: 'IdStatus',
    type: DataTypes.INTEGER,
    allowNull: false
  }

  bankAccountId = {
    field: 'IdContaBancaria',
    type: DataTypes.SMALLINT,
    allowNull: false
  }
}
