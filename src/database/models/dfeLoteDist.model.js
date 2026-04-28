import { DataTypes } from 'sequelize';

export class DFeLoteDist {

  id = {
    field: 'Id',
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.BIGINT
  }

  nsu = {
    field: 'Nsu',
    allowNull: false,
    type: DataTypes.BIGINT
  }

  idSchema = {
    field: 'IdSchema',
    allowNull: false,
    type: DataTypes.INTEGER
  }

  docXml = {
    field: 'DocXml',
    allowNull: false,
    type: DataTypes.TEXT
  }

  data = {
    field: 'Data',
    allowNull: false,
    type: DataTypes.DATE
  }

  userId = {
    field: 'UserId',
    allowNull: false,
    type: DataTypes.UUID
  }

  isUnPack = {
    field: 'IsUnPack',
    allowNull: false,
    type: DataTypes.BOOLEAN
  }

  /**
   * FK para DfeRepositorioNFe após `syncDistributionsToRepositorio` (schemas/XML habituais ou chNFe já no repositório).
   * NOT NULL = já vinculado. NULL = pendente ou XML sem chNFe de 44 dígitos.
   */
  idDfeRepositorioNFe = {
    field: 'IdDfeRepositorioNFe',
    allowNull: true,
    type: DataTypes.BIGINT
  }

  companyId = {
    field: 'IDEmpresaFilial',
    allowNull: true,
    type: DataTypes.TINYINT
  }

  /** Lote manifestado que originou este registro (consChNFe pós-manifestação). NULL = recebido só pela distribuição normal (conta em ultNSU). */
  idDFeLoteDistOrigem = {
    field: 'IdDFeLoteDistOrigem',
    allowNull: true,
    type: DataTypes.BIGINT,
  }

}
