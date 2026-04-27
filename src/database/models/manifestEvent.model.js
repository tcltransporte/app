import { DataTypes } from 'sequelize';

export class ManifestEvent {

  id = {
    field: 'Id',
    primaryKey: true,
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
  }

  distributionId = {
    field: 'DistributionId',
    allowNull: false,
    type: DataTypes.BIGINT
  }

  manifestationCode = {
    field: 'ManifestationCode',
    allowNull: false,
    type: DataTypes.STRING(10)
  }

  success = {
    field: 'Success',
    allowNull: false,
    type: DataTypes.BOOLEAN
  }

  message = {
    field: 'Message',
    allowNull: true,
    type: DataTypes.STRING(500)
  }

  occurredAt = {
    field: 'OccurredAt',
    allowNull: false,
    type: DataTypes.DATE
  }

  userId = {
    field: 'UserId',
    allowNull: true,
    type: DataTypes.UUID
  }
}
