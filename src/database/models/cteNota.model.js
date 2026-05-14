import { DataTypes } from 'sequelize'

/** Tabela `CteNotas` — vínculo N:N entre `Ctes` e `nota`. */
export class CteNota {
  id = {
    field: 'ID',
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.BIGINT
  }

  notaId = {
    field: 'IDNota',
    type: DataTypes.BIGINT,
    allowNull: false
  }

  cteId = {
    field: 'IDCte',
    type: DataTypes.BIGINT,
    allowNull: false
  }
}
