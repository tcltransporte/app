import { DataTypes } from 'sequelize';

export class DocumentRequestType {
  id = {
    field: 'ID',
    primaryKey: true,
    type: DataTypes.INTEGER
  }

  description = {
    field: 'Descricao',
    allowNull: false,
    type: DataTypes.STRING(50)
  }

}
