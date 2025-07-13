import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaLogsComponent } from './lista-logs.component';

describe('ListaLogsComponent', () => {
  let component: ListaLogsComponent;
  let fixture: ComponentFixture<ListaLogsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ListaLogsComponent]
    });
    fixture = TestBed.createComponent(ListaLogsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
