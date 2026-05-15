import { DataTypes } from 'sequelize'

/**
 * Tabela `dbo.TipoComponenteValorFrete` — tipos de componente do valor de frete.
 */
export class ShipmentCompositionType {
  id = {
    field: 'ID',
    primaryKey: true,
    type: DataTypes.INTEGER
  }

  description = {
    field: 'Descricao',
    allowNull: true,
    type: DataTypes.STRING(60)
  }
}
