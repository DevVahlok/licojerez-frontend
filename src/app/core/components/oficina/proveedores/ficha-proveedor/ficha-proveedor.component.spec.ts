import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FichaProveedorComponent } from './ficha-proveedor.component';

describe('FichaProveedorComponent', () => {
  let component: FichaProveedorComponent;
  let fixture: ComponentFixture<FichaProveedorComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FichaProveedorComponent]
    });
    fixture = TestBed.createComponent(FichaProveedorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
