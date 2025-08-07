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
    activo: boolean,
    comision_default: number,
    tiene_lote: boolean,
    idMarca: number
}

export interface Proveedor {
    activo: boolean,
    banco: string,
    banco_bic: string,
    cif: string,
    ciudad: string,
    codigo: number,
    codigo_cuenta_cliente: string,
    codigo_postal: number,
    contacto: string,
    created_at: string,
    descuento: number,
    direccion: string,
    domiciliacion_banco: string,
    email: string,
    exento_iva: boolean,
    fax: number,
    iban: string,
    localizacion_banco: string,
    nombre: string,
    pais: string,
    provincia: string,
    recc: boolean,
    telefono_1: number,
    telefono_2: number,
    web: string
}

export interface Familia {

}

export interface Subfamilia {

}

export interface Marca {

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