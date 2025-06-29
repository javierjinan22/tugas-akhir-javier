import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

interface AcademicYear {
  id: number;
  name: string;
}

@Component({
  selector: 'app-create-new-class',
  templateUrl: './create-new-class.component.html',
  styleUrls: ['./create-new-class.component.css']
})
export class CreateNewClassComponent implements OnInit {

  classForm: FormGroup;
  
  // Academic years data for dropdown
  academicYears: AcademicYear[] = [
    { id: 1, name: '2024/2025' },
    { id: 2, name: '2023/2024' },
    { id: 3, name: '2022/2023' }
  ];

  // Selected values
  selectedAcademicYear: AcademicYear | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) { 
    this.classForm = this.fb.group({
      className: ['', [Validators.required]],
      academicYearId: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.selectedAcademicYear = this.academicYears[0];
    this.classForm.patchValue({
      academicYearId: this.academicYears[0].id
    });
  }

  onCancelClicked(){

  }

  onSubmitClicked(){
    if (this.classForm.invalid) {
      // Mark all fields as touched to trigger validation visuals
      Object.keys(this.classForm.controls).forEach(key => {
        const control = this.classForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    const formData = this.classForm.value;
    console.log('Creating new class:', formData);

    // Here you would make an API call to save the class
    // For now, just simulate success and navigate back
    
    // Show success message (could use a toast service)
    alert('Kelas berhasil dibuat!');
    
    // Navigate back to class list
    this.router.navigate(['/guru/kelola-kelas']);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.classForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }
  
  // Handle academic year selection
  onAcademicYearChange(year: AcademicYear): void {
    this.selectedAcademicYear = year;
    this.classForm.patchValue({
      academicYearId: year.id
    });
  }

}
