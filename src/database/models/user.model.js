import { DataTypes, Sequelize } from 'sequelize'

export class User {

  id = {
    field: 'UserId',
    primaryKey: true,
    type: DataTypes.UUIDV4
  }

  applicationId = {
    field: 'ApplicationId',
    allowNull: false,
    type: DataTypes.UUIDV4
  }

  userName = {
    field: 'UserName',
    type: DataTypes.STRING
  }

  employeeId = {
    field: 'employeeId',
    type: DataTypes.BIGINT
  }

  loweredUserName = {
    field: 'LoweredUserName',
    type: DataTypes.STRING
  }

  lastActivityDate = {
    field: 'LastActivityDate',
    allowNull: false,
    type: DataTypes.DATE,
    defaultValue: Sequelize.literal('GETDATE()')
  }

  isAnonymous = {
    field: 'IsAnonymous',
    allowNull: false,
    defaultValue: false,
    type: DataTypes.BOOLEAN
  }

  googleAccessToken = {
    field: 'GoogleAccessToken',
    type: DataTypes.TEXT
  }

  googleRefreshToken = {
    field: 'GoogleRefreshToken',
    type: DataTypes.TEXT
  }

  googleTokenExpiry = {
    field: 'GoogleTokenExpiry',
    type: DataTypes.BIGINT
  }

}