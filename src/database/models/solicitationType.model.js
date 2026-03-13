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

  type = {
    field: 'Tipo',
    allowNull: false,
    type: DataTypes.STRING(10) // 'Entrada' or 'Saida'
  }

  companyId = {
    field: 'CompanyId',
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
