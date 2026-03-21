import { DataTypes } from 'sequelize';

export class SolicitationStatus {

  id = {
    field: 'Id',
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.INTEGER
  }

  description = {
    field: 'Descricao',
    allowNull: false,
    type: DataTypes.STRING(100)
  }

  companyId = {
    field: 'companyId',
    allowNull: false,
    type: DataTypes.INTEGER
  }

  generateDocument = {
    field: 'generateDocument',
    allowNull: true,
    defaultValue: false,
    type: DataTypes.BOOLEAN
  }

}
