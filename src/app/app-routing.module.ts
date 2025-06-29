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


// const routes: Routes = [];
// const routes: Routes = [
//   { path: '', component: LandingPageComponent }
// ];

const routes: Routes = [
  { path: '', component: LandingPageComponent }, // tetap

  {
    path: 'guru',
    component: TeacherLayoutComponent,
    children: [
       { path: 'dashboard', component: TeacherDashboardComponent },
       { path: 'kelola-kelas', component: ManageClassComponent },
       { path: 'kelola-kelas/tambah-kelas', component: CreateNewClassComponent},
       { path: 'kelola-kelas/detail-kelas/:id', component: ClassDetailComponent},
       { path: 'kelola-kelas/detail-kelas/:id/tambah-siswa', component: ConnectStudentToClassComponent},
       { path: 'kelola-kelas/detail-kelas/:id/tambah-siswa/buat-akun-siswa', component: CreateStudentAccountComponent},
       { path: 'kelola-materi', component: ManageMaterialsComponent},
       { path: 'kelola-materi/tambah-materi', component: CreateMaterialsComponent },
       { path: 'kelola-materi/edit-materi', component: EditMaterialsComponent},
       { path: 'kelola-materi/tambah-materi/tambah-quiz', component: CreateQuizComponent },
       { path: 'hasil-belajar', component: ManageLearningOutcomesComponent },
       { path: 'hasil-belajar/detail-materi-belajar/:id', component: DetailLearningOutcomesComponent },
       { path: 'hasil-belajar/detail-materi-belajar/:id/detail-siswa', component: DetailStudentsLearningOutcomesComponent },
       { path: 'hasil-belajar/detail-materi-belajar/:materiId/detail-siswa/:siswaId/koreksi-jawaban', component: AnswerReviewComponent 
}

    ]
  },
  {
    path: 'siswa',
    component: StudentLayoutComponent,
    children: [
      // { path: 'dashboard', component: SiswaDashboardComponent },
      // { path: 'materi', component: DaftarMateriComponent },
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
