import { DataTypes } from 'sequelize';

export class SolicitationDocument {
  id = {
    field: 'ID',
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.BIGINT
  }

  solicitationId = {
    field: 'IDSolicitacao',
    allowNull: false,
    type: DataTypes.BIGINT
  }

  documentId = {
    field: 'IDCompra',
    allowNull: true,
    type: DataTypes.BIGINT
  }
}
