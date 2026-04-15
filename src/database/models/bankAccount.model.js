import { DataTypes } from 'sequelize';

export class BankAccount {
  id = {
    field: 'codigo_conta_bancaria',
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.SMALLINT
  }

  agency = {
    field: 'agencia',
    type: DataTypes.STRING(30),
    allowNull: false
  }

  bankName = {
    field: 'nome_banco',
    type: DataTypes.STRING(50),
    allowNull: false
  }

  accountNumber = {
    field: 'numero_conta_bancaria',
    type: DataTypes.STRING(30),
    allowNull: false
  }

  holderName = {
    field: 'nome_titular',
    type: DataTypes.STRING(50),
    allowNull: false
  }

  initialBalance = {
    field: 'saldo_inicial',
    type: DataTypes.DECIMAL(19, 4),
    allowNull: false
  }

  description = {
    field: 'descricao',
    type: DataTypes.STRING(50),
    allowNull: false
  }

  companyId = {
    field: 'CodigoEmpresaFilial',
    type: DataTypes.TINYINT,
    allowNull: true
  }

  accountPlanId = {
    field: 'IDPlanoContasContabil',
    type: DataTypes.INTEGER,
    allowNull: true
  }

  isActive = {
    field: 'IsAtivo',
    type: DataTypes.BOOLEAN,
    allowNull: true
  }

  bankId = {
    field: 'bankId',
    type: DataTypes.INTEGER,
    allowNull: true
  }

  companyIntegrationId = {
    field: 'companyIntegrationId',
    type: DataTypes.UUID,
    allowNull: true
  }

  externalId = {
    field: 'externalId',
    type: DataTypes.STRING(15),
    allowNull: true
  }

}
