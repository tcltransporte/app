import { DataTypes } from 'sequelize';

export class SolicitationStatusTipo {

  id = {
    field: 'Id',
    primaryKey: true,
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4
  }

  statusId = {
    field: 'IDStatus',
    allowNull: false,
    type: DataTypes.INTEGER
  }

  typeId = {
    field: 'IDTipoSolicitacao',
    allowNull: false,
    type: DataTypes.INTEGER
  }

}
