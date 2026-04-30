import { DataTypes } from 'sequelize'

export class UserRole {

  userId = {
    field: 'UserId',
    primaryKey: true,
    allowNull: false,
    type: DataTypes.UUIDV4
  }

  roleId = {
    field: 'RoleId',
    primaryKey: true,
    allowNull: false,
    type: DataTypes.UUIDV4
  }

}
