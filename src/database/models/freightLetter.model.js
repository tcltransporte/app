import { DataTypes } from 'sequelize';

export class FreightLetter {

  id = {
    field: 'ID',
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.BIGINT
  }

  solicitationId = {
    field: 'IDSolicitacao',
    allowNull: true,
    type: DataTypes.BIGINT
  }

  loadId = {
    field: 'IDCarga',
    allowNull: true,
    type: DataTypes.BIGINT
  }

  freightLetterComponentTypeId = {
    field: 'IDTipoComponenteCartaFrete',
    allowNull: false,
    type: DataTypes.INTEGER
  }

  value = {
    field: 'Valor',
    allowNull: false,
    type: DataTypes.DECIMAL(19, 4)
  }

  discountValue = {
    field: 'ValorDesconto',
    allowNull: false,
    type: DataTypes.DECIMAL(19, 4)
  }

  operatorProtocol = {
    field: 'ProtocoloOperadora',
    allowNull: true,
    type: DataTypes.CHAR(10)
  }

  statusId = {
    field: 'IDStatus',
    allowNull: false,
    type: DataTypes.INTEGER
  }

  operatorId = {
    field: 'IDOperadora',
    allowNull: false,
    type: DataTypes.INTEGER
  }

  reason = {
    field: 'xMotivo',
    allowNull: true,
    type: DataTypes.STRING(500)
  }

  effectiveDate = {
    field: 'DataEfetivacao',
    allowNull: false,
    type: DataTypes.DATE
  }

  movementId = {
    field: 'IDMovimento',
    allowNull: true,
    type: DataTypes.BIGINT
  }

  isSynchronized = {
    field: 'Sincronizado',
    allowNull: false,
    type: DataTypes.BOOLEAN
  }

  payeeId = {
    field: 'IDFavorecido',
    allowNull: true,
    type: DataTypes.BIGINT
  }

  tripTravelId = {
    field: 'IDViagemGrupo',
    allowNull: true,
    type: DataTypes.BIGINT
  }

  isOtherPayee = {
    field: 'ISFavorecidoOutro',
    allowNull: true,
    type: DataTypes.BOOLEAN
  }

  description = {
    field: 'Descricao',
    allowNull: true,
    type: DataTypes.STRING(200)
  }

  cardNumber = {
    field: 'NumeroCartao',
    allowNull: true,
    type: DataTypes.CHAR(16)
  }

  tripId = {
    field: 'IdViagem',
    allowNull: false,
    type: DataTypes.BIGINT
  }

  freightContractId = {
    field: 'IdContratoFrete',
    allowNull: true,
    type: DataTypes.BIGINT
  }
}
