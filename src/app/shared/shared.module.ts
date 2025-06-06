import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ArrayWrapperComponent } from './array-wrapper/array-wrapper.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { SidebarComponent } from './sidebar/sidebar.component';
import { NavbarTopComponent } from './navbar-top/navbar-top.component';



@NgModule({
  declarations: [
    ArrayWrapperComponent,
    SidebarComponent,
    NavbarTopComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    FontAwesomeModule,
    ReactiveFormsModule
  ],
  exports: [
    ArrayWrapperComponent,
    ReactiveFormsModule,
    SidebarComponent,
    NavbarTopComponent
  ]
})
export class SharedModule { }
