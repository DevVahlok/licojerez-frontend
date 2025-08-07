import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditarArticuloComponent } from './editar-articulo.component';

describe('EditarArticuloComponent', () => {
  let component: EditarArticuloComponent;
  let fixture: ComponentFixture<EditarArticuloComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EditarArticuloComponent]
    });
    fixture = TestBed.createComponent(EditarArticuloComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
