import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { MatDialogRef as MatDialogRef, MAT_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
    selector: 'dialog-confirmacion',
    templateUrl: 'dialog-confirmacion.html',
    styleUrls: ['dialog-confirmacion.scss'],
    encapsulation: ViewEncapsulation.None
})

export class DialogConfirmacion {

    constructor(public dialogRef: MatDialogRef<DialogConfirmacion>, @Inject(MAT_DIALOG_DATA) public data: any) { }

    ngOnInit(): void { }

    salir(valor: boolean) {
        this.dialogRef.close(valor);
    }
}