import { DataTypes } from 'sequelize';

export class Solicitation {

  id = {
    field: 'ID',
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.BIGINT
  }

  typeId = {
    field: 'IDTipoSolicitacao',
    allowNull: false,
    type: DataTypes.INTEGER
  }

  description = {
    field: 'Descricao',
    type: DataTypes.STRING(100)
  }

  statusId = {
    field: 'IDTipoStatus',
    allowNull: true,
    type: DataTypes.INTEGER
  }

  date = {
    field: 'Data',
    allowNull: false,
    type: DataTypes.DATE
  }

  userId = {
    field: 'UserID',
    allowNull: false,
    type: DataTypes.UUID
  }

  number = {
    field: 'Numero',
    allowNull: false,
    type: DataTypes.INTEGER
  }

  forecastDate = {
    field: 'dataPrevisao',
    allowNull: true,
    type: DataTypes.DATE
  }

  tripId = {
    field: 'idViagem',
    allowNull: true,
    type: DataTypes.BIGINT
  }

  tripTravelId = {
    field: 'IdViagemGrupo',
    allowNull: true,
    type: DataTypes.BIGINT
  }

  processId = {
    field: 'IdProcesso',
    allowNull: true,
    type: DataTypes.BIGINT
  }

  partnerId = {
    field: 'partnerId',
    allowNull: true,
    type: DataTypes.BIGINT
  }

  companyId = {
    field: 'companyId',
    allowNull: true,
    type: DataTypes.SMALLINT
  }

  tributationId = {
    field: 'tributationId',
    allowNull: true,
    type: DataTypes.UUID
  }

  sellerId = {
    field: 'sellerId',
    allowNull: true,
    type: DataTypes.BIGINT
  }

  alreadyGenerated = {
    field: 'alreadyGenerated',
    allowNull: false,
    defaultValue: false,
    type: DataTypes.BOOLEAN
  }

}