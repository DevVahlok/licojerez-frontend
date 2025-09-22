export interface Articulo {
    fecha_alta: string,
    nombre: string,
    ean13_1: number,
    stock: number,
    precio_coste: number,
    tipo: 'Material' | 'Servicio',
    id_articulo: number,
    precio_venta: number,
    ean13_2: number,
    ean13_3: number,
    ean13_4: number,
    ean13_5: number,
    id_proveedor: number,
    id_familia: number,
    id_subfamilia: number,
    id_iva: number,
    margen: number,
    activo: boolean,
    comision_default: number,
    tiene_lote: boolean,
    id_marca: number
}

export interface Proveedor {
    activo: boolean,
    banco: string,
    banco_bic: string,
    cif: string,
    ciudad: string,
    id_proveedor: number,
    codigo_cuenta_cliente: string,
    codigo_postal: number,
    contacto: string,
    fecha_alta: string,
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

export interface Centro {
    id_centro: number,
    nombre: string,
    zona: string,
    domicilio: string,
    localidad: string
}

export interface Familia {
    id_familia: number,
    fecha_alta: string,
    nombre: string
}

export interface Subfamilia {
    id_subfamilia: number,
    fecha_alta: string,
    nombre: string,
    id_familia: number
}

export interface Marca {
    id_marca: number,
    fecha_alta: string,
    nombre: string
}

export interface IVA {
    id_iva: number,
    fecha_alta: string,
    valor_iva: number,
    valor_recargo_equivalencia: number
}

export interface ConfigTabla {
    id_config: number,
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

export interface Etiqueta {
    id_articulo: number,
    nombre: string,
    precio_final: number,
    precio_sin_iva: number
}