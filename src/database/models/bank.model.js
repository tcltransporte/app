import { DataTypes } from 'sequelize';

export class Bank {

  id = {
    field: 'ID',
    primaryKey: true,
    type: DataTypes.INTEGER,
    allowNull: false
  }

  description = {
    field: 'Descricao',
    type: DataTypes.STRING(50),
    allowNull: false
  }

  code = {
    field: 'Codigo',
    type: DataTypes.CHAR(3),
    allowNull: false
  }

  cnpj = {
    field: 'CNPJ',
    type: DataTypes.STRING(14),
    allowNull: true
  }
}
