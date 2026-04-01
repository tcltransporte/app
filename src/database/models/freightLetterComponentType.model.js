import { DataTypes } from 'sequelize';

export class FreightLetterComponentType {
  id = {
    field: 'ID',
    primaryKey: true,
    type: DataTypes.INTEGER
  }

  description = {
    field: 'Descricao',
    allowNull: false,
    type: DataTypes.CHAR(15)
  }

  operationTypeId = {
    field: 'IdOperacaoTipo',
    allowNull: false,
    type: DataTypes.TINYINT
  }
}
