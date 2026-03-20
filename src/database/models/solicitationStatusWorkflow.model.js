import { DataTypes } from 'sequelize';

export class SolicitationStatusWorkflow {

  id = {
    field: 'Id',
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
    type: DataTypes.UUID
  }

  fromStatusId = {
    field: 'IDTipoStatusOrigem',
    allowNull: false,
    type: DataTypes.INTEGER
  }

  toStatusId = {
    field: 'IDTipoStatusDestino',
    allowNull: false,
    type: DataTypes.INTEGER
  }

}
