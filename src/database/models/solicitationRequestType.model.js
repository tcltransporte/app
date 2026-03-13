import { DataTypes } from 'sequelize';

export class SolicitationRequestType {

  id = {
    field: 'id',
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.TINYINT
  }

  description = {
    field: 'description',
    allowNull: true,
    type: DataTypes.STRING(50)
  }

}
