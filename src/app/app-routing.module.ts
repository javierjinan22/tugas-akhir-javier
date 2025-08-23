import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LandingPageComponent } from './features/landing-page/landing-page.component';
import { TeacherLayoutComponent } from './layout/teacher-layout/teacher-layout.component';
import { StudentLayoutComponent } from './layout/student-layout/student-layout.component';
import { TeacherDashboardComponent } from './pages/teacher/teacher-dashboard/teacher-dashboard.component';
import { ManageMaterialsComponent } from './pages/teacher/manage-materials/manage-materials.component';
import { CreateMaterialsComponent } from './pages/teacher/manage-materials/create-materials/create-materials.component';
import { CreateQuizComponent } from './pages/teacher/manage-materials/create-quiz/create-quiz.component';
import { EditMaterialsComponent } from './pages/teacher/manage-materials/edit-materials/edit-materials.component';
import { ManageClassComponent } from './pages/teacher/manage-class/manage-class.component';
import { ClassDetailComponent } from './pages/teacher/manage-class/class-detail/class-detail.component';
import { ConnectStudentToClassComponent } from './pages/teacher/manage-class/connect-student-to-class/connect-student-to-class.component';
import { CreateStudentAccountComponent } from './pages/teacher/manage-class/create-student-account/create-student-account.component';
import { CreateNewClassComponent } from './pages/teacher/manage-class/create-new-class/create-new-class.component';
import { ManageLearningOutcomesComponent } from './pages/teacher/manage-learning-outcomes/manage-learning-outcomes.component';
import { DetailLearningOutcomesComponent } from './pages/teacher/manage-learning-outcomes/detail-learning-outcomes/detail-learning-outcomes.component';
import { DetailStudentsLearningOutcomesComponent } from './pages/teacher/manage-learning-outcomes/detail-students-learning-outcomes/detail-students-learning-outcomes.component';
import { AnswerReviewComponent } from './pages/teacher/manage-learning-outcomes/answer-review/answer-review.component';
import { StudentDashboardComponent } from './pages/student/student-dashboard/student-dashboard.component';
import { MaterialListComponent } from './pages/student/material-list/material-list.component';
import { ViewMaterialComponent } from './pages/student/material-list/view-material/view-material.component';
import { TakeQuizComponent } from './pages/student/material-list/take-quiz/take-quiz.component';
import { ViewQuizComponent } from './pages/student/material-list/view-quiz/view-quiz.component';
import { DetailHistoryQuizComponent } from './pages/student/material-list/detail-history-quiz/detail-history-quiz.component';
import { AuthGuard } from './guards/auth.guard';
import { ClassEditComponent } from './pages/teacher/manage-class/class-edit/class-edit.component';
import { ClassArchivedComponent } from './pages/teacher/manage-class/class-archived/class-archived.component';
import { DetailMaterialsComponent } from './pages/teacher/manage-materials/detail-materials/detail-materials.component';


// const routes: Routes = [];
// const routes: Routes = [
//   { path: '', component: LandingPageComponent }
// ];

const routes: Routes = [
  { path: '', component: LandingPageComponent }, // tetap

  {
    path: 'guru',
    component: TeacherLayoutComponent,
    canActivate: [AuthGuard],
    data: { role: 'guru' },
    children: [
       { path: 'dashboard', component: TeacherDashboardComponent,canActivate: [AuthGuard] },
       { path: 'kelola-kelas', component: ManageClassComponent },
       { path: 'kelola-kelas/arsip', component: ClassArchivedComponent },
       { path: 'kelola-kelas/tambah-kelas', component: CreateNewClassComponent},
       { path: 'kelola-kelas/edit-kelas/:id', component: ClassEditComponent},
       { path: 'kelola-kelas/detail-kelas/:id', component: ClassDetailComponent},
       { path: 'kelola-kelas/detail-kelas/:id/tambah-siswa', component: ConnectStudentToClassComponent},
       { path: 'kelola-kelas/detail-kelas/:id/tambah-siswa/buat-akun-siswa', component: CreateStudentAccountComponent},
       { path: 'kelola-materi', component: ManageMaterialsComponent},
       { path: 'kelola-materi/tambah-materi', component: CreateMaterialsComponent },
       { path: 'kelola-materi/edit-materi/:id', component: EditMaterialsComponent},
       { path: 'kelola-materi/detail-materi/:id', component: DetailMaterialsComponent}, 
       { path: 'kelola-materi/tambah-materi/tambah-quiz', component: CreateQuizComponent },
       { path: 'hasil-belajar', component: ManageLearningOutcomesComponent },
       { path: 'hasil-belajar/detail-materi-belajar/:id', component: DetailLearningOutcomesComponent },
       { path: 'hasil-belajar/detail-materi-belajar/:id/detail-siswa', component: DetailStudentsLearningOutcomesComponent },
       { path: 'hasil-belajar/detail-materi-belajar/:materiId/detail-siswa/:siswaId/koreksi-jawaban', component: AnswerReviewComponent }

    ]
  },
  {
    path: 'siswa',
    component: StudentLayoutComponent,
    canActivate: [AuthGuard],
    data: { role: 'siswa' },
    children: [
      { path: 'dashboard', component: StudentDashboardComponent },
      { path: 'materi', component: MaterialListComponent},
      { path: 'materi/lihat-materi/:id', component: ViewMaterialComponent},
      { path: 'materi/lihat-materi/:id/kuis', component: TakeQuizComponent},
      { path: 'materi/lihat-materi/:id/kuis/kerjakan', component: ViewQuizComponent},
      { path: 'materi/lihat-materi/:id/kuis/hasil', component: DetailHistoryQuizComponent},
      // { path: 'riwayat', component: RiwayatBelajarComponent }
    ]
  },
  { path: '**', redirectTo: '' } // fallback ke landing page
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
