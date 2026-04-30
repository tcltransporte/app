import { DataTypes } from 'sequelize'

export class Role {

  applicationId = {
    field: 'ApplicationId',
    allowNull: false,
    type: DataTypes.UUIDV4
  }

  id = {
    field: 'RoleId',
    primaryKey: true,
    allowNull: false,
    type: DataTypes.UUIDV4
  }

  roleName = {
    field: 'RoleName',
    allowNull: false,
    type: DataTypes.STRING(256)
  }

  loweredRoleName = {
    field: 'LoweredRoleName',
    allowNull: false,
    type: DataTypes.STRING(256)
  }

  description = {
    field: 'Description',
    allowNull: true,
    type: DataTypes.STRING(256)
  }

}
