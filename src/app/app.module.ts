import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

// Font Awesome
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

// NGX Bootstrap
import { BsModalService, ModalModule } from 'ngx-bootstrap/modal';

// NGX Select
import { NgxSelectModule } from 'ngx-select-ex';

// CKEditor
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';

// Import your components
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// Import all your feature components
import { LandingPageComponent } from './features/landing-page/landing-page.component';
import { LoginModalComponent } from './features/login-modal/login-modal.component';
import { SelectRoleModalComponent } from './features/select-role-modal/select-role-modal.component';
import { StudentRegistrationModalComponent } from './features/student-registration-modal/student-registration-modal.component';
import { TeacherRegistrationModalComponent } from './features/teacher-registration-modal/teacher-registration-modal.component';
import { InputNpsnModalComponent } from './features/input-npsn-modal/input-npsn-modal.component';
import { SchoolConnectionModalComponent } from './features/school-connection-modal/school-connection-modal.component';
import { ClassConnectionModalComponent } from './features/class-connection-modal/class-connection-modal.component';

// Layout components
import { StudentLayoutComponent } from './layout/student-layout/student-layout.component';
import { TeacherLayoutComponent } from './layout/teacher-layout/teacher-layout.component';
import { NavbarTopComponent } from './shared/navbar-top/navbar-top.component';
import { SidebarComponent } from './shared/sidebar/sidebar.component';

// Student pages
import { MaterialListComponent } from './pages/student/material-list/material-list.component';
import { MaterialStudiedComponent } from './pages/student/material-list/material-studied/material-studied.component';
import { MaterialFinishedComponent } from './pages/student/material-list/material-finished/material-finished.component';
import { ViewMaterialComponent } from './pages/student/material-list/view-material/view-material.component';
import { TakeQuizComponent } from './pages/student/material-list/take-quiz/take-quiz.component';
import { ViewQuizComponent } from './pages/student/material-list/view-quiz/view-quiz.component';
import { DetailHistoryQuizComponent } from './pages/student/material-list/detail-history-quiz/detail-history-quiz.component';
import { ModalDownloadComponent } from './pages/student/material-list/modal-download/modal-download.component';
import { ModalStartQuizComponent } from './pages/student/material-list/modal-start-quiz/modal-start-quiz.component';
import { ModalEndQuizComponent } from './pages/student/material-list/modal-end-quiz/modal-end-quiz.component';

// Teacher pages
import { ManageClassComponent } from './pages/teacher/manage-class/manage-class.component';
import { CreateNewClassComponent } from './pages/teacher/manage-class/create-new-class/create-new-class.component';
import { ClassDetailComponent } from './pages/teacher/manage-class/class-detail/class-detail.component';
import { ConnectStudentToClassComponent } from './pages/teacher/manage-class/connect-student-to-class/connect-student-to-class.component';
import { CreateStudentAccountComponent } from './pages/teacher/manage-class/create-student-account/create-student-account.component';
import { ModalAddStudentToClassComponent } from './pages/teacher/manage-class/modal-add-student-to-class/modal-add-student-to-class.component';

// Teacher materials
import { ManageMaterialsComponent } from './pages/teacher/manage-materials/manage-materials.component';
import { CreateMaterialsComponent } from './pages/teacher/manage-materials/create-materials/create-materials.component';
import { EditMaterialsComponent } from './pages/teacher/manage-materials/edit-materials/edit-materials.component';
import { CreateQuizComponent } from './pages/teacher/manage-materials/create-quiz/create-quiz.component';

// Teacher learning outcomes
import { TeacherDashboardComponent } from './pages/teacher/teacher-dashboard/teacher-dashboard.component';
import { ManageLearningOutcomesComponent } from './pages/teacher/manage-learning-outcomes/manage-learning-outcomes.component';
import { DetailLearningOutcomesComponent } from './pages/teacher/manage-learning-outcomes/detail-learning-outcomes/detail-learning-outcomes.component';
import { DetailStudentsLearningOutcomesComponent } from './pages/teacher/manage-learning-outcomes/detail-students-learning-outcomes/detail-students-learning-outcomes.component';
import { AnswerReviewComponent } from './pages/teacher/manage-learning-outcomes/answer-review/answer-review.component';
import { ModalAddFeedbackComponent } from './pages/teacher/manage-learning-outcomes/modal-add-feedback/modal-add-feedback.component';
import { ModalSaveReviewComponent } from './pages/teacher/manage-learning-outcomes/modal-save-review/modal-save-review.component';

// Shared components
import { ArrayWrapperComponent } from './shared/array-wrapper/array-wrapper.component';
import { StudentDashboardComponent } from './pages/student/student-dashboard/student-dashboard.component';
import { ClassEditComponent } from './pages/teacher/manage-class/class-edit/class-edit.component';
import { ModalConfirmationDeleteComponent } from './pages/teacher/manage-class/modal-confirmation-delete/modal-confirmation-delete.component';
import { ClassArchivedComponent } from './pages/teacher/manage-class/class-archived/class-archived.component';
import { ModalRestoreClassComponent } from './pages/teacher/manage-class/modal-restore-class/modal-restore-class.component';
import { ModalDeleteStudentComponent } from './pages/teacher/manage-class/modal-delete-student/modal-delete-student.component';

@NgModule({
  declarations: [
    AppComponent,
    
    // Features
    LandingPageComponent,
    LoginModalComponent,
    SelectRoleModalComponent,
    StudentRegistrationModalComponent,
    TeacherRegistrationModalComponent,
    InputNpsnModalComponent,
    SchoolConnectionModalComponent,
    ClassConnectionModalComponent,
    
    // Layout
    StudentLayoutComponent,
    TeacherLayoutComponent,
    NavbarTopComponent,
    SidebarComponent,
    
    // Student pages
    StudentDashboardComponent,
    MaterialListComponent,
    MaterialStudiedComponent,
    MaterialFinishedComponent,
    ViewMaterialComponent,
    TakeQuizComponent,
    ViewQuizComponent,
    DetailHistoryQuizComponent,
    ModalDownloadComponent,
    ModalStartQuizComponent,
    ModalEndQuizComponent,
    
    // Teacher pages
    TeacherDashboardComponent,
    ManageClassComponent,
    CreateNewClassComponent,
    ClassDetailComponent,
    ConnectStudentToClassComponent,
    CreateStudentAccountComponent,
    ModalAddStudentToClassComponent,
    
    // Teacher materials
    ManageMaterialsComponent,
    CreateMaterialsComponent,
    EditMaterialsComponent,
    CreateQuizComponent,
    
    // Teacher learning outcomes
    ManageLearningOutcomesComponent,
    DetailLearningOutcomesComponent,
    DetailStudentsLearningOutcomesComponent,
    AnswerReviewComponent,
    ModalAddFeedbackComponent,
    ModalSaveReviewComponent,
    
    // Shared
    ArrayWrapperComponent,
         ClassEditComponent,
         ModalConfirmationDeleteComponent,
         ClassArchivedComponent,
         ModalRestoreClassComponent,
         ModalDeleteStudentComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterModule,
    AppRoutingModule,
    
    // Third party modules
    FontAwesomeModule,
    ModalModule.forRoot(),
    NgxSelectModule,
    CKEditorModule
  ],
  providers: [
    BsModalService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
