import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { SharedModule } from './shared/shared.module';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LandingPageComponent } from './features/landing-page/landing-page.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { LoginModalComponent } from './features/login-modal/login-modal.component';
import { RouterModule } from '@angular/router';
import { ModalModule } from 'ngx-bootstrap/modal';
import { FormsModule } from '@angular/forms';
import { SelectRoleModalComponent } from './features/select-role-modal/select-role-modal.component';
import { TeacherRegistrationModalComponent } from './features/teacher-registration-modal/teacher-registration-modal.component';
import { StudentRegistrationModalComponent } from './features/student-registration-modal/student-registration-modal.component';
import { NgxSelectModule } from 'ngx-select-ex';
import { InputNpsnModalComponent } from './features/input-npsn-modal/input-npsn-modal.component';
import { SchoolConnectionModalComponent } from './features/school-connection-modal/school-connection-modal.component';
import { ClassConnectionModalComponent } from './features/class-connection-modal/class-connection-modal.component';
import { TeacherLayoutComponent } from './layout/teacher-layout/teacher-layout.component';
import { StudentLayoutComponent } from './layout/student-layout/student-layout.component';
import { TeacherDashboardComponent } from './pages/teacher/teacher-dashboard/teacher-dashboard.component';


@NgModule({
  declarations: [
    AppComponent,
    LandingPageComponent,
    LoginModalComponent,
    SelectRoleModalComponent,
    TeacherRegistrationModalComponent,
    StudentRegistrationModalComponent,
    InputNpsnModalComponent,
    SchoolConnectionModalComponent,
    ClassConnectionModalComponent,
    TeacherLayoutComponent,
    StudentLayoutComponent,
    TeacherDashboardComponent
  ],
  imports: [
    BrowserModule,
    SharedModule,
    AppRoutingModule,
    FontAwesomeModule,
    ModalModule.forRoot(),
    RouterModule.forRoot([]),
    FormsModule,
    NgxSelectModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
