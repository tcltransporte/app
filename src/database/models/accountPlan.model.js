import { DataTypes } from 'sequelize';

export class AccountPlan {

  id = {
    field: 'ID',
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.INTEGER
  }

  code = {
    field: 'Codigo',
    type: DataTypes.CHAR(15),
    allowNull: false
  }

  account = {
    field: 'Conta',
    type: DataTypes.CHAR(20),
    allowNull: false
  }

  description = {
    field: 'Descricao',
    type: DataTypes.STRING(100),
    allowNull: false
  }

  operationTypeId = {
    field: 'codigo_tipo_operacao',
    type: DataTypes.TINYINT,
    allowNull: true
  }

  accountGroupId = {
    field: 'idPlanoGrupo',
    type: DataTypes.INTEGER,
    allowNull: true
  }

  companyId = {
    field: 'idEmpresa',
    type: DataTypes.INTEGER,
    allowNull: true
  }

  isActive = {
    field: 'IsAtivo',
    type: DataTypes.BOOLEAN,
    allowNull: true
  }

  externalId = {
    field: 'externalId',
    type: DataTypes.STRING(15),
    allowNull: true
  }
}
