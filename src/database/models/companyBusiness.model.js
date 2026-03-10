import { DataTypes } from 'sequelize';

export class CompanyBusiness {

  id = {
    field: 'codigo_empresa',
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.INTEGER
  }

  name = {
    field: 'descricao',
    type: DataTypes.STRING
  }

}