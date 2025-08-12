import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { MatDialogRef as MatDialogRef, MAT_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ConfigTablaTabulator } from '../../components/tabla-tabulator/tabla-tabulator.component';
import { MatCheckboxChange } from '@angular/material/checkbox';

@Component({
    selector: 'dialog-config-tabla',
    templateUrl: 'dialog-config-tabla.html',
    styleUrls: ['dialog-config-tabla.scss'],
    encapsulation: ViewEncapsulation.None
})

export class DialogConfigTabla {

    public listaColumnas: ConfigTablaTabulator[] = []
    public marcarTodo: boolean = false;

    constructor(public dialogRef: MatDialogRef<DialogConfigTabla>, @Inject(MAT_DIALOG_DATA) public data: any) { }

    ngOnInit() {
        this.listaColumnas = structuredClone(this.data.listaColumnas);
        this.marcarTodo = this.listaColumnas.every(e => e.visible);
    }

    drop(evento: CdkDragDrop<string[]>) {
        moveItemInArray(this.listaColumnas, evento.previousIndex, evento.currentIndex);
        this.listaColumnas.forEach((e, i) => { e.order = i + 1 })
    }

    cambioCheckbox(evento: MatCheckboxChange, index: number) {
        this.listaColumnas[index].visible = evento.checked;
        this.marcarTodo = this.listaColumnas.every(e => e.visible);
    }

    close(guardar: boolean) {
        this.dialogRef.close(guardar ? this.listaColumnas : null)
    }

    toggleMarcarTodo(valor: boolean) {
        this.listaColumnas.forEach(e => e.visible = valor)
        this.marcarTodo = this.listaColumnas.every(e => e.visible);
    }
}