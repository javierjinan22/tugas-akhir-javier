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
import { ManageMaterialsComponent } from './pages/teacher/manage-materials/manage-materials.component';
import { CreateMaterialsComponent } from './pages/teacher/manage-materials/create-materials/create-materials.component';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { CreateQuizComponent } from './pages/teacher/manage-materials/create-quiz/create-quiz.component';
import { EditMaterialsComponent } from './pages/teacher/manage-materials/edit-materials/edit-materials.component';
import { ManageClassComponent } from './pages/teacher/manage-class/manage-class.component';
import { ClassDetailComponent } from './pages/teacher/manage-class/class-detail/class-detail.component';
import { ConnectStudentToClassComponent } from './pages/teacher/manage-class/connect-student-to-class/connect-student-to-class.component';
import { ModalAddStudentToClassComponent } from './pages/teacher/manage-class/modal-add-student-to-class/modal-add-student-to-class.component';
import { CreateStudentAccountComponent } from './pages/teacher/manage-class/create-student-account/create-student-account.component';
import { CreateNewClassComponent } from './pages/teacher/manage-class/create-new-class/create-new-class.component';
import { ManageLearningOutcomesComponent } from './pages/teacher/manage-learning-outcomes/manage-learning-outcomes.component';
import { DetailLearningOutcomesComponent } from './pages/teacher/manage-learning-outcomes/detail-learning-outcomes/detail-learning-outcomes.component';
import { AnswerReviewComponent } from './pages/teacher/manage-learning-outcomes/answer-review/answer-review.component';
import { DetailStudentsLearningOutcomesComponent } from './pages/teacher/manage-learning-outcomes/detail-students-learning-outcomes/detail-students-learning-outcomes.component';
import { ModalAddFeedbackComponent } from './pages/teacher/manage-learning-outcomes/modal-add-feedback/modal-add-feedback.component';
import { ModalSaveReviewComponent } from './pages/teacher/manage-learning-outcomes/modal-save-review/modal-save-review.component';



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
    TeacherDashboardComponent,
    ManageMaterialsComponent,
    CreateMaterialsComponent,
    CreateQuizComponent,
    EditMaterialsComponent,
    ManageClassComponent,
    ClassDetailComponent,
    ConnectStudentToClassComponent,
    ModalAddStudentToClassComponent,
    CreateStudentAccountComponent,
    CreateNewClassComponent,
    ManageLearningOutcomesComponent,
    DetailLearningOutcomesComponent,
    AnswerReviewComponent,
    DetailStudentsLearningOutcomesComponent,
    ModalAddFeedbackComponent,
    ModalSaveReviewComponent
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
    CKEditorModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
