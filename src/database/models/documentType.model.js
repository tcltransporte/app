import { DataTypes } from 'sequelize';

export class DocumentType {
  id = {
    field: 'ID',
    primaryKey: true,
    type: DataTypes.INTEGER
  }

  description = {
    field: 'Descricao',
    allowNull: true,
    type: DataTypes.STRING(100)
  }

  initials = {
    field: 'Sigla',
    allowNull: true,
    type: DataTypes.STRING(5)
  }

  isAccounting = {
    field: 'IsContabil',
    allowNull: true,
    type: DataTypes.BOOLEAN
  }

  isFiscal = {
    field: 'IsFiscal',
    allowNull: true,
    type: DataTypes.BOOLEAN
  }

  accountingCode = {
    field: 'CodigoContabil',
    allowNull: true,
    type: DataTypes.STRING(2)
  }

  surname = {
    field: 'Apelido',
    allowNull: true,
    type: DataTypes.STRING(50)
  }

}
