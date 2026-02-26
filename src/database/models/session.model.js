import { Sequelize, DataTypes } from 'sequelize';

export class Session {

  id = {
    field: 'ID',
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.UUIDV4
  }

  userId = {
    field: 'userId',
    type: DataTypes.UUIDV4
  }

  companyId = {
    field: 'companyId',
    type: DataTypes.UUIDV4
  }

  lastAcess = {
    field: 'lastAcess',
    type: DataTypes.DATE
  }

  expireIn = {
    field: 'expireIn',
    type: DataTypes.INTEGER
  }


}