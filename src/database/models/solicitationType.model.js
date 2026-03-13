import { DataTypes } from 'sequelize';

export class SolicitationType {

  id = {
    field: 'Id',
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.INTEGER
  }

  description = {
    field: 'Descricao',
    allowNull: false,
    type: DataTypes.STRING(255)
  }

  requestType = {
    field: 'requestType',
    allowNull: false,
    type: DataTypes.INTEGER
  }

  companyId = {
    field: 'companyId',
    allowNull: false,
    type: DataTypes.INTEGER
  }

  hash = {
    field: 'hash',
    allowNull: false,
    type: DataTypes.STRING(100)
  }

  order = {
    field: 'order',
    allowNull: false,
    defaultValue: 0,
    type: DataTypes.INTEGER
  }

}
