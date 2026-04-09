import { DataTypes } from 'sequelize';

export class BankMovement {
  id = {
    field: 'codigo_movimento_bancario',
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.BIGINT
  }

  bankAccountId = {
    field: 'codigo_conta_bancaria',
    type: DataTypes.SMALLINT,
    allowNull: false
  }

  typeId = {
    field: 'tipo_movimento_bancario',
    type: DataTypes.TINYINT,
    allowNull: false
  }

  entryDate = {
    field: 'data_lancamento',
    type: DataTypes.DATE,
    allowNull: false
  }

  realDate = {
    field: 'data_real',
    type: DataTypes.DATE,
    allowNull: true
  }

  value = {
    field: 'valor',
    type: DataTypes.DECIMAL(19, 4),
    allowNull: false
  }

  documentNumber = {
    field: 'numero_documento',
    type: DataTypes.BIGINT,
    allowNull: false
  }

  description = {
    field: 'descricao',
    type: DataTypes.STRING(1000),
    allowNull: true
  }

  nominal = {
    field: 'nominal',
    type: DataTypes.STRING(50),
    allowNull: true
  }

  preDatedDate = {
    field: 'data_predatado',
    type: DataTypes.DATE,
    allowNull: true
  }

  paymentEntryId = {
    field: 'IDPagamentoDetalhe',
    type: DataTypes.BIGINT,
    allowNull: true
  }

  isReconciled = {
    field: 'boolConciliado',
    type: DataTypes.BOOLEAN,
    allowNull: true
  }

  originBankAccountId = {
    field: 'IDContaBancariaOrigem',
    type: DataTypes.SMALLINT,
    allowNull: true
  }
}
