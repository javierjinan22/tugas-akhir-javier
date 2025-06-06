import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LandingPageComponent } from './features/landing-page/landing-page.component';
import { TeacherLayoutComponent } from './layout/teacher-layout/teacher-layout.component';
import { StudentLayoutComponent } from './layout/student-layout/student-layout.component';
import { TeacherDashboardComponent } from './pages/teacher/teacher-dashboard/teacher-dashboard.component';

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
      // { path: 'kelola-kelas', component: KelolaKelasComponent },
      // { path: 'kelola-materi', component: KelolaMateriComponent },
      // { path: 'hasil-belajar', component: HasilBelajarComponent }
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
