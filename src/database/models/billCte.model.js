import { DataTypes } from 'sequelize';

export class BillCte {
  id = {
    field: 'ID',
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.BIGINT
  }

  cteId = {
    field: 'IDCte',
    type: DataTypes.BIGINT,
    allowNull: false
  }

  preInvoiceNumber = {
    field: 'NumeroPreFatura',
    type: DataTypes.INTEGER,
    allowNull: false
  }

  billId = {
    field: 'IDFatura',
    type: DataTypes.BIGINT,
    allowNull: false
  }

  movementDetailId = {
    field: 'IDMovimentoDetalhe',
    type: DataTypes.BIGINT,
    allowNull: true
  }

  movementId = {
    field: 'IDMovimento',
    type: DataTypes.BIGINT,
    allowNull: true
  }
}
