import { DataTypes } from 'sequelize';

export class SolicitationProduct {

  id = {
    field: 'ID',
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.BIGINT
  }

  itemId = {
    field: 'IDItemEstoque',
    allowNull: true,
    type: DataTypes.BIGINT
  }

  quantity = {
    field: 'Quantidade',
    allowNull: false,
    type: DataTypes.DECIMAL(18, 4)
  }

  solicitationId = {
    field: 'IDSolicitacao',
    allowNull: false,
    type: DataTypes.BIGINT
  }

  value = {
    field: 'Valor',
    allowNull: false,
    type: DataTypes.DECIMAL(19, 4)
  }

  supplierId = {
    field: 'IDFornecedor',
    allowNull: true,
    type: DataTypes.BIGINT
  }

  vehicleId = {
    field: 'IDVeiculo',
    allowNull: false,
    type: DataTypes.INTEGER
  }

  isWithoutInvoice = {
    field: 'IsSemNota',
    allowNull: true,
    type: DataTypes.BOOLEAN
  }

  stockMovementId = {
    field: 'IdMovimentoEstoque',
    allowNull: true,
    type: DataTypes.BIGINT
  }

  purchaseItemId = {
    field: 'IdCompraItem',
    allowNull: true,
    type: DataTypes.BIGINT
  }

  workshopTypeId = {
    field: 'SolicitacaoOficinaTipoID',
    allowNull: true,
    type: DataTypes.INTEGER
  }

  workshopLocationId = {
    field: 'SolicitacaoOficinaLocalID',
    allowNull: true,
    type: DataTypes.INTEGER
  }

}
