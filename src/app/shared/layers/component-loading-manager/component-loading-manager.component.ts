import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges, TemplateRef, ViewEncapsulation } from '@angular/core';

export interface LoadingManagerEvent {
  type: string,
  name: string,
  value: 'reload' | 'minimized' | 'unminimized' | null
}

@Component({
  selector: 'app-component-loading-manager',
  templateUrl: './component-loading-manager.component.html',
  styleUrls: ['./component-loading-manager.component.scss'],
  encapsulation: ViewEncapsulation.None
})

export class ComponentLoadingManagerComponent implements OnInit {

  @Input() name: string;
  @Input() progress: number;
  @Input() template: TemplateRef<any>;
  @Input() actionBar = { minimized: false };
  @Input() size = { width: '0', height: '0' };
  @Output() emitter: EventEmitter<LoadingManagerEvent> = new EventEmitter();
  public firstLoad: boolean = true;
  @Input() minimized: boolean = false;
  private originalSize: { width: string, height: string };

  constructor() { }

  ngOnInit(): void { }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['progress']?.currentValue >= 100) {
      this.firstLoad = false;
    }

    if (changes['size']) {
      this.originalSize = JSON.parse(JSON.stringify(this.size));
    }
  }

  reload() {
    this.firstLoad = true;
    this.emitter.emit({ type: 'component-loading-manager', name: this.name, value: 'reload' })
  }

  minimizarComponente() {
    this.minimized = !this.minimized;

    if (this.minimized) {
      this.size.height = '25px';
    } else {
      this.size.height = JSON.parse(JSON.stringify(this.originalSize.height));
    }

    const evento: LoadingManagerEvent = { type: 'component-loading-manager', name: this.name, value: null };
    this.minimized ? evento.value = 'minimized' : evento.value = 'unminimized';
    this.emitter.emit(evento)
  }
}