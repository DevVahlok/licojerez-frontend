import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaFamiliasSubfamiliasComponent } from './lista-familias-subfamilias.component';

describe('ListaFamiliasSubfamiliasComponent', () => {
  let component: ListaFamiliasSubfamiliasComponent;
  let fixture: ComponentFixture<ListaFamiliasSubfamiliasComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ListaFamiliasSubfamiliasComponent]
    });
    fixture = TestBed.createComponent(ListaFamiliasSubfamiliasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
