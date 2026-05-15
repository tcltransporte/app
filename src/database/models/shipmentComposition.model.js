import { DataTypes } from 'sequelize'

/**
 * Tabela `dbo.CompValorFrete` — composição do valor de frete do romaneio (carga).
 */
export class ShipmentComposition {
  id = {
    field: 'ID',
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.BIGINT
  }

  loadId = {
    field: 'IDCarga',
    allowNull: false,
    type: DataTypes.BIGINT
  }

  compositionTypeId = {
    field: 'IDTipoComponenteValorFrete',
    allowNull: false,
    type: DataTypes.INTEGER
  }

  value = {
    field: 'Valor',
    allowNull: false,
    type: DataTypes.DECIMAL(19, 4)
  }
}
