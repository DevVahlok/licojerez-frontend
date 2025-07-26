import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FichaArticuloComponent } from './ficha-articulo.component';

describe('FichaArticuloComponent', () => {
  let component: FichaArticuloComponent;
  let fixture: ComponentFixture<FichaArticuloComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FichaArticuloComponent]
    });
    fixture = TestBed.createComponent(FichaArticuloComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
