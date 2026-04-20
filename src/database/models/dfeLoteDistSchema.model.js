import { DataTypes } from 'sequelize';

export class DFeLoteDistSchema {

  id = {
    field: 'Id',
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.INTEGER
  }

  descricao = {
    field: 'Descricao',
    allowNull: true,
    type: DataTypes.NVARCHAR(50)
  }

  schema = {
    field: 'Schema',
    allowNull: false,
    type: DataTypes.NVARCHAR(50)
  }

}
