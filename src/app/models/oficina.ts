export interface Articulo {
    fecha_alta: string,
    nombre: string,
    ean13_1: number,
    stock: number,
    precio_coste: number,
    tipo: 'Material' | 'Servicio',
    codigo: number,
    precio_venta: number,
    ean13_2: number,
    ean13_3: number,
    ean13_4: number,
    ean13_5: number,
    idProveedor: number,
    idFamilia: number,
    idSubfamilia: number,
    idIva: number,
    margen: number,
    activo: boolean | string,
    comision_default: number,
    tiene_lote: boolean | string,
    idMarca: number
}

export interface ConfigTabla {
    id: number,
    viewname: string,
    user: string,
    config: {
        field: string,
        order: number,
        width: number,
        visible: boolean
    }[],
    created_at: string
}