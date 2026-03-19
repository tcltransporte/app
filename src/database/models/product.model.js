import { DataTypes } from 'sequelize';

export class Product {

  id = {
    field: 'codigo_item_estoque',
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.BIGINT
  }

  description = {
    field: 'descricao',
    type: DataTypes.STRING(500)
  }

  quantity = {
    field: 'quantidade',
    type: DataTypes.DECIMAL(18, 4)
  }

  minimumQuantity = {
    field: 'quantidade_minima',
    type: DataTypes.INTEGER
  }

  unitId = {
    field: 'codigo_unidade',
    type: DataTypes.INTEGER
  }

  name = {
    field: 'nome',
    type: DataTypes.STRING(200)
  }

  approvalQuantity = {
    field: 'quantidade_aprovacao',
    type: DataTypes.INTEGER
  }

  approvalValue = {
    field: 'valor_aprovacao',
    type: DataTypes.DECIMAL(19, 4) // MONEY
  }

  brandId = {
    field: 'IDMarca',
    type: DataTypes.INTEGER
  }

  manufacturerCode = {
    field: 'CodigoFabricante',
    type: DataTypes.CHAR(50)
  }

  internalCode = {
    field: 'CodigoInterno',
    type: DataTypes.CHAR(50)
  }

  itemTypeId = {
    field: 'IDTipoItem',
    type: DataTypes.INTEGER
  }

  itemPossessionTypeId = {
    field: 'IDTipoPosseItem',
    type: DataTypes.INTEGER
  }

  defaultPrice = {
    field: 'valorPadrao',
    type: DataTypes.DECIMAL(19, 4) // MONEY
  }

  productCode = {
    field: 'CodigoProduto',
    type: DataTypes.CHAR(50)
  }

  ncmId = {
    field: 'IDNCM',
    type: DataTypes.INTEGER
  }

  inputUnitId = {
    field: 'IDUnidadeEntrada',
    type: DataTypes.INTEGER
  }

  conversionFactor = {
    field: 'fatorConversao',
    type: DataTypes.DECIMAL(18, 4)
  }

  isMinimumStock = {
    field: 'IsEstoqueMinimo',
    type: DataTypes.BOOLEAN
  }

  categoryId = {
    field: 'IDCategoria',
    type: DataTypes.INTEGER
  }

  subcategoryId = {
    field: 'IDSubcategoria',
    type: DataTypes.INTEGER
  }

  positionId = {
    field: 'IDPosicao',
    type: DataTypes.INTEGER
  }

  sideId = {
    field: 'IDLado',
    type: DataTypes.INTEGER
  }

  levelId = {
    field: 'IDNivel',
    type: DataTypes.INTEGER
  }

  labelTypeId = {
    field: 'IDTipoEtiqueta',
    type: DataTypes.INTEGER
  }

  isActive = {
    field: 'IsAtivo',
    type: DataTypes.BOOLEAN
  }

  cestId = {
    field: 'IDCEST',
    type: DataTypes.INTEGER
  }

  itemStockBrandId = {
    field: 'IDItemEstoqueMarca',
    type: DataTypes.INTEGER
  }

}
