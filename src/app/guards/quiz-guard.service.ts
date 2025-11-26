import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';
import { Observable } from 'rxjs';

export interface CanComponentDeactivate {
  canDeactivate(): Observable<boolean> | Promise<boolean> | boolean;
  isQuizActive(): boolean;
  confirmExit(): void; 
}

@Injectable({
  providedIn: 'root'
})
export class QuizGuardService implements CanDeactivate<CanComponentDeactivate> {

  canDeactivate(
    component: CanComponentDeactivate
  ): Observable<boolean> | Promise<boolean> | boolean {
    
    // ✅ Jika quiz tidak aktif, izinkan navigasi
    if (!component.isQuizActive()) {
      console.log('Quiz not active, allowing navigation');
      return true;
    }

    // ✅ Jika quiz aktif, panggil confirmExit dan prevent navigasi
    console.log('Quiz is active, showing modal via component');
    component.confirmExit();
    return false; 
  }
}