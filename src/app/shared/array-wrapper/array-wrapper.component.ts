import { Component, ContentChild, OnInit, TemplateRef, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { faPlus, faMinus } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-array-wrapper',
  templateUrl: './array-wrapper.component.html',
  styleUrls: ['./array-wrapper.component.css']
})
export class ArrayWrapperComponent {
  @ContentChild('content', { static: false }) contentTemplateRef!: TemplateRef<any>;
  @Input() data: any[] = []; // data bisa array of object atau FormArray.controls
  @Output() addEvent = new EventEmitter<any>();
  @Output() deleteEvent = new EventEmitter<any>();

  onDeleteButtonClicked($event: MouseEvent, index: number): void {
    this.deleteEvent.emit({ event: $event, index });
  }

  onAddButtonClicked($event: MouseEvent, index: number): void {
    this.addEvent.emit({ event: $event, index });
  }
}

// @Component({
//   selector: 'app-array-wrapper',
//   templateUrl: './array-wrapper.component.html',
//   styleUrls: ['./array-wrapper.component.css']
// })
// export class ArrayWrapperComponent implements OnInit {
//   faPlus = faPlus;
//   faMinus = faMinus;

//   @ContentChild('content', { static: false }) contentTemplateRef: TemplateRef<any> = {} as TemplateRef<any>;


//   counter = [{}];  // Menyimpan data form yang ditambah atau dihapus

  
//   @Input() data: any[] = [];
//   @Output() addEvent = new EventEmitter<any>();
//   @Output() deleteEvent = new EventEmitter<any>();

//   constructor() { }

//   ngOnInit(): void {
//     this.syncCounter();
//   }

//   // Fungsi untuk menghapus item berdasarkan index
//   onDeleteButtonClicked($event: MouseEvent, index: number): void {
//     this.counter = this.counter.filter((x, i) => i !== index);
//     this.deleteEvent.emit({ event: $event, index: index });
//   }

//   // Fungsi untuk menambah item baru
//   onAddButtonClicked($event: MouseEvent, index: number): void {
//     this.counter = [...this.counter, {}];
//     this.addEvent.emit({ event: $event, index: index });
//   }

//   ngOnChanges(changes: SimpleChanges) {
//     if ('data' in changes) {
//       this.syncCounter();
//     }
//   }

//   syncCounter() {
//     // Set counter jumlahnya sama dengan data input (misal FormArray)
//     if (this.data && this.data.length) {
//       this.counter = Array(this.data.length).fill({});
//     } else {
//       this.counter = [{}];
//     }
//   }
// }

