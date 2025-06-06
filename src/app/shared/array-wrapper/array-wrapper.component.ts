// import { Component, OnInit } from '@angular/core';
// import { EventEmitter, Input, Output } from '@angular/core';
// import { faPlus, faMinus } from '@fortawesome/free-solid-svg-icons';

// @Component({
//   selector: 'app-array-wrapper',
//   templateUrl: './array-wrapper.component.html',
//   styleUrls: ['./array-wrapper.component.css']
// })
// export class ArrayWrapperComponent implements OnInit {
//   faPlus = faPlus;
//   faMinus = faMinus;

//   @Output() add = new EventEmitter<void>();
//   @Output() remove = new EventEmitter<void>();

  

//   constructor() { }

//   ngOnInit(): void {
//   }

//   addItem() {
//     this.add.emit();
//   }

//   removeItem() {
//     this.remove.emit();
//   }

// }

import { Component, ContentChild, OnInit, TemplateRef, Input, Output, EventEmitter } from '@angular/core';
import { faPlus, faMinus } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-array-wrapper',
  templateUrl: './array-wrapper.component.html',
  styleUrls: ['./array-wrapper.component.css']
})
export class ArrayWrapperComponent implements OnInit {
  faPlus = faPlus;
  faMinus = faMinus;

  @ContentChild('content', { static: false }) contentTemplateRef: TemplateRef<any> = {} as TemplateRef<any>;


  counter = [{}];  // Menyimpan data form yang ditambah atau dihapus

  
  @Input() data: any[] = [];
  @Output() addEvent = new EventEmitter<any>();
  @Output() deleteEvent = new EventEmitter<any>();

  constructor() { }

  ngOnInit(): void {}

  // Fungsi untuk menghapus item berdasarkan index
  onDeleteButtonClicked($event: MouseEvent, index: number): void {
    this.counter = this.counter.filter((x, i) => i !== index);
    this.deleteEvent.emit({ event: $event, index: index });
  }

  // Fungsi untuk menambah item baru
  onAddButtonClicked($event: MouseEvent, index: number): void {
    this.counter = [...this.counter, {}];
    this.addEvent.emit({ event: $event, index: index });
  }
}

