import { DataTypes } from 'sequelize';

export class DfeRepositorioNFe {

  id = {
    field: 'Id',
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.BIGINT
  }

  idLoteDistDFe = {
    field: 'IdLoteDistDFe',
    allowNull: false,
    type: DataTypes.BIGINT
  }

  numeroDoc = {
    field: 'NumeroDoc',
    allowNull: false,
    type: DataTypes.INTEGER
  }

  chNFe = {
    field: 'chNFe',
    allowNull: false,
    type: DataTypes.CHAR(44)
  }

  emitente = {
    field: 'Emitente',
    allowNull: false,
    type: DataTypes.STRING(100)
  }

  destinatario = {
    field: 'Destinatario',
    allowNull: false,
    type: DataTypes.STRING(100)
  }

  /** Emitente (resNFe): raiz do resumo; opcional em NF-e completa (emit). */
  cnpj = {
    field: 'Cnpj',
    allowNull: true,
    type: DataTypes.STRING(14),
  }

  ie = {
    field: 'Ie',
    allowNull: true,
    type: DataTypes.STRING(20),
  }

  /** Valor da NF (`vNF` no XML resNFe / total). */
  valorNf = {
    field: 'vNF',
    allowNull: true,
    type: DataTypes.DECIMAL(18, 2),
  }

  dhEmi = {
    field: 'dhEmi',
    allowNull: false,
    type: DataTypes.DATE
  }

  idStatus = {
    field: 'IdStatus',
    allowNull: false,
    type: DataTypes.TINYINT
  }

  dataExportacao = {
    field: 'DataExportacao',
    allowNull: true,
    type: DataTypes.DATE
  }

  userIdExportacao = {
    field: 'UserIdExportacao',
    allowNull: true,
    type: DataTypes.UUID
  }

  idFkCompras = {
    field: 'IdFkCompras',
    allowNull: true,
    type: DataTypes.BIGINT
  }

  idFkNota = {
    field: 'IdFkNota',
    allowNull: true,
    type: DataTypes.BIGINT
  }

  isExportada = {
    field: 'IsExportada',
    allowNull: false,
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }

  idDestino = {
    field: 'IdDestino',
    allowNull: true,
    type: DataTypes.TINYINT
  }

  xMotivo = {
    field: 'xMotivo',
    allowNull: true,
    type: DataTypes.STRING(50)
  }

  /** Latest row in ManifestEvent for this NF-e in the repository. */
  lastManifestEventId = {
    field: 'LastManifestEventId',
    allowNull: true,
    type: DataTypes.UUID
  }

  companyId = {
    field: 'IDEmpresaFilial',
    allowNull: true,
    type: DataTypes.TINYINT
  }
}
