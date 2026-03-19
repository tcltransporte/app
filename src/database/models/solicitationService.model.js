import { DataTypes } from 'sequelize';

export class SolicitationService {

  id = {
    field: 'ID',
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.BIGINT
  }

  itemId = {
    field: 'IDServico',
    allowNull: false,
    type: DataTypes.INTEGER
  }

  quantity = {
    field: 'Quantidade',
    allowNull: false,
    type: DataTypes.INTEGER
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
    allowNull: true,
    type: DataTypes.INTEGER
  }

  date = {
    field: 'Data',
    allowNull: true,
    type: DataTypes.DATE
  }

  description = {
    field: 'Descricao',
    allowNull: true,
    type: DataTypes.STRING(2000)
  }

  isWithoutInvoice = {
    field: 'IsSemNota',
    allowNull: true,
    type: DataTypes.BOOLEAN
  }

}
