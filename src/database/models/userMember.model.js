import { DataTypes, Sequelize } from 'sequelize'

export class UserMember {

  userId = {
    field: 'UserId',
    primaryKey: true,
    type: DataTypes.UUIDV4
  }

  applicationId = {
    field: 'ApplicationId',
    allowNull: false,
    type: DataTypes.UUIDV4
  }

  email = {
    field: 'Email',
    type: DataTypes.STRING
  }

  password = {
    field: 'Password',
    type: DataTypes.STRING
  }

  passwordFormat = {
    field: 'PasswordFormat',
    allowNull: false,
    defaultValue: 1,
    type: DataTypes.INTEGER
  }

  passwordSalt = {
    field: 'PasswordSalt',
    allowNull: false,
    type: DataTypes.STRING
  }

  isApproved = {
    field: 'isApproved',
    allowNull: false,
    defaultValue: true,
    type: DataTypes.BOOLEAN
  }

  isLockedOut = {
    field: 'IsLockedOut',
    allowNull: false,
    defaultValue: false,
    type: DataTypes.BOOLEAN
  }

  createAt = {
    field: 'CreateDate',
    allowNull: false,
    type: DataTypes.DATE,
    defaultValue: Sequelize.literal('GETDATE()')
  }

  lastLoginAt = {
    field: 'LastLoginDate',
    allowNull: false,
    type: DataTypes.DATE,
    defaultValue: Sequelize.literal('GETDATE()')
  }

  lastPasswordChangedAt = {
    field: 'LastPasswordChangedDate',
    allowNull: false,
    type: DataTypes.DATE,
    defaultValue: Sequelize.literal('GETDATE()')
  }

  lastLockoutAt = {
    field: 'LastLockoutDate',
    allowNull: false,
    defaultValue: '1754-01-01 00:00:00.000',
    type: DataTypes.STRING
  }

  failedPasswordAttemptCount = {
    field: 'FailedPasswordAttemptCount',
    allowNull: false,
    defaultValue: 0,
    type: DataTypes.INTEGER
  }

  failedPasswordAttemptWindowStart = {
    field: 'FailedPasswordAttemptWindowStart',
    allowNull: false,
    type: DataTypes.DATE,
    defaultValue: '1754-01-01 00:00:00.000'
  }

  failedPasswordAnswerAttemptCount = {
    field: 'FailedPasswordAnswerAttemptCount',
    allowNull: false,
    defaultValue: 0,
    type: DataTypes.INTEGER
  }

  failedPasswordAnswerAttemptWindowStart = {
    field: 'FailedPasswordAnswerAttemptWindowStart',
    allowNull: false,
    type: DataTypes.DATE,
    defaultValue: '1754-01-01 00:00:00.000'
  }

}