import { AbstractControl, ValidationErrors, ValidatorFn, FormGroup } from '@angular/forms';

export class CustomValidators {
  
  // ============= USERNAME VALIDATORS =============
  
  static username(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      
      if (!value) {
        return null; // Required validator akan handle empty value
      }
      
      // Check minimum length
      if (value.length < 3) {
        return { 
          usernameMinLength: { 
            requiredLength: 3, 
            actualLength: value.length,
            message: 'Username minimal 3 karakter'
          } 
        };
      }
      
      // Check maximum length
      if (value.length > 20) {
        return { 
          usernameMaxLength: { 
            maxLength: 20, 
            actualLength: value.length,
            message: 'Username maksimal 20 karakter'
          } 
        };
      }
      
      // Only allow letters, numbers, and underscores
      const validPattern = /^[a-zA-Z0-9_]+$/;
      if (!validPattern.test(value)) {
        return { 
          usernamePattern: { 
            pattern: validPattern.toString(),
            actualValue: value,
            message: 'Username hanya boleh berisi huruf, angka, dan underscore (_)'
          } 
        };
      }
      
      // Cannot start with number
      if (/^\d/.test(value)) {
        return { 
          usernameStartsWithNumber: { 
            message: 'Username tidak boleh dimulai dengan angka'
          } 
        };
      }
      
      // Cannot be all numbers
      if (/^\d+$/.test(value)) {
        return { 
          usernameAllNumbers: { 
            message: 'Username tidak boleh hanya berisi angka'
          } 
        };
      }
      
      return null;
    };
  }

  // ============= EMAIL VALIDATORS =============
  
  static email(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      
      if (!value) {
        return null; // Required validator akan handle empty value
      }
      
      // Basic email pattern (more comprehensive than Angular's default)
      const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      
      if (!emailPattern.test(value)) {
        return { 
          emailPattern: { 
            message: 'Format email tidak valid'
          } 
        };
      }
      
      // Check for consecutive dots
      if (/\.{2,}/.test(value)) {
        return { 
          emailConsecutiveDots: { 
            message: 'Email tidak boleh mengandung titik berturut-turut'
          } 
        };
      }
      
      // Check for valid domain
      const domain = value.split('@')[1];
      if (domain && domain.length < 4) {
        return { 
          emailInvalidDomain: { 
            message: 'Domain email tidak valid'
          } 
        };
      }
      
      return null;
    };
  }

  // ============= NUPTK VALIDATORS =============
  
  static nuptk(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      
      if (!value) {
        return null; // Required validator akan handle empty value
      }
      
      // Remove any non-digit characters for validation
      const digits = value.replace(/\D/g, '');
      
      // Check exact length (16 digits)
      if (digits.length !== 16) {
        return { 
          nuptkLength: { 
            requiredLength: 16, 
            actualLength: digits.length,
            message: `NUPTK harus terdiri dari 16 digit angka (saat ini: ${digits.length} digit)`
          } 
        };
      }
      
      // Basic NUPTK format validation (not all zeros, not all same digit)
      if (/^0+$/.test(digits)) {
        return { 
          nuptkAllZeros: { 
            message: 'NUPTK tidak boleh berisi semua angka nol'
          } 
        };
      }
      
      // Check for repeated single digit
      if (/^(\d)\1{15}$/.test(digits)) {
        return { 
          nuptkRepeatedDigit: { 
            message: 'NUPTK tidak boleh berisi angka yang sama semua'
          } 
        };
      }
      
      return null;
    };
  }

  // ============= PASSWORD VALIDATORS =============
  
  static password(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      
      if (!value) {
        return null; // Required validator akan handle empty value
      }
      
      const errors: any = {};
      
      // Minimum length
      if (value.length < 6) {
        errors.passwordMinLength = {
          requiredLength: 6,
          actualLength: value.length,
          message: 'Password minimal 6 karakter'
        };
      }
      
      // Maximum length
      if (value.length > 50) {
        errors.passwordMaxLength = {
          maxLength: 50,
          actualLength: value.length,
          message: 'Password maksimal 50 karakter'
        };
      }
      
      // At least one letter
      if (!/[a-zA-Z]/.test(value)) {
        errors.passwordNoLetter = {
          message: 'Password harus mengandung minimal satu huruf'
        };
      }
      
      // Cannot be all spaces
      if (/^\s+$/.test(value)) {
        errors.passwordAllSpaces = {
          message: 'Password tidak boleh hanya berisi spasi'
        };
      }
      
      return Object.keys(errors).length > 0 ? errors : null;
    };
  }

  static strongPassword(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      
      if (!value) {
        return null;
      }
      
      const errors: any = {};
      
      // Minimum length
      if (value.length < 8) {
        errors.strongPasswordMinLength = {
          requiredLength: 8,
          actualLength: value.length,
          message: 'Password minimal 8 karakter untuk keamanan yang baik'
        };
      }
      
      // At least one uppercase letter
      if (!/[A-Z]/.test(value)) {
        errors.strongPasswordNoUppercase = {
          message: 'Password harus mengandung minimal satu huruf besar'
        };
      }
      
      // At least one lowercase letter
      if (!/[a-z]/.test(value)) {
        errors.strongPasswordNoLowercase = {
          message: 'Password harus mengandung minimal satu huruf kecil'
        };
      }
      
      // At least one number
      if (!/\d/.test(value)) {
        errors.strongPasswordNoNumber = {
          message: 'Password harus mengandung minimal satu angka'
        };
      }
      
      return Object.keys(errors).length > 0 ? errors : null;
    };
  }

  // ============= FORM GROUP VALIDATORS =============
  
  static passwordMatch(passwordField: string, confirmPasswordField: string): ValidatorFn {
    return (formGroup: AbstractControl): ValidationErrors | null => {
      if (!(formGroup instanceof FormGroup)) {
        return null;
      }
      
      const password = formGroup.get(passwordField);
      const confirmPassword = formGroup.get(confirmPasswordField);
      
      if (!password || !confirmPassword) {
        return null;
      }
      
      if (password.value !== confirmPassword.value) {
        // Set error on confirm password field
        confirmPassword.setErrors({ 
          ...confirmPassword.errors,
          passwordMismatch: {
            message: 'Password dan konfirmasi password tidak cocok'
          }
        });
        return { passwordMismatch: true };
      } else {
        // Clear password mismatch error if passwords match
        if (confirmPassword.errors) {
          delete confirmPassword.errors['passwordMismatch'];
          if (Object.keys(confirmPassword.errors).length === 0) {
            confirmPassword.setErrors(null);
          }
        }
      }
      
      return null;
    };
  }

  // ============= NAMA VALIDATORS =============
  
  static fullName(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      
      if (!value) {
        return null;
      }
      
      // Remove extra spaces and check
      const trimmedValue = value.trim();
      
      if (trimmedValue.length < 2) {
        return { 
          fullNameMinLength: { 
            requiredLength: 2, 
            actualLength: trimmedValue.length,
            message: 'Nama lengkap minimal 2 karakter'
          } 
        };
      }
      
      // Only allow letters, spaces, and common name characters
      const validPattern = /^[a-zA-Z\s.',-]+$/;
      if (!validPattern.test(trimmedValue)) {
        return { 
          fullNamePattern: { 
            message: 'Nama lengkap hanya boleh berisi huruf, spasi, dan tanda baca umum'
          } 
        };
      }
      
      // Check for excessive consecutive spaces
      if (/\s{3,}/.test(value)) {
        return { 
          fullNameExcessiveSpaces: { 
            message: 'Nama tidak boleh mengandung spasi berlebihan'
          } 
        };
      }
      
      // Should contain at least one letter
      if (!/[a-zA-Z]/.test(trimmedValue)) {
        return { 
          fullNameNoLetter: { 
            message: 'Nama harus mengandung minimal satu huruf'
          } 
        };
      }
      
      return null;
    };
  }

  // ============= INSTANSI VALIDATORS =============
  
  static instansi(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      
      if (!value) {
        return null;
      }
      
      const trimmedValue = value.trim();
      
      if (trimmedValue.length < 3) {
        return { 
          instansiMinLength: { 
            requiredLength: 3, 
            actualLength: trimmedValue.length,
            message: 'Nama instansi minimal 3 karakter'
          } 
        };
      }
      
      // Allow letters, numbers, spaces, and common punctuation
      const validPattern = /^[a-zA-Z0-9\s.,'()/-]+$/;
      if (!validPattern.test(trimmedValue)) {
        return { 
          instansiPattern: { 
            message: 'Nama instansi mengandung karakter yang tidak diizinkan'
          } 
        };
      }
      
      return null;
    };
  }

  // ============= UTILITY METHODS =============
  
  /**
   * ✅ PERBAIKAN: Get first error message from control dengan custom required messages
   */
  static getFirstErrorMessage(control: AbstractControl, fieldName?: string): string {
    if (!control.errors) return '';
    
    const firstErrorKey = Object.keys(control.errors)[0];
    const error = control.errors[firstErrorKey];
    
    // ✅ TAMBAH: Custom required messages berdasarkan field name
    if (firstErrorKey === 'required') {
      switch (fieldName) {
        case 'nama_lengkap':
          return 'Nama lengkap harus diisi';
        case 'username':
          return 'Username harus diisi';
        case 'password':
          return 'Password harus diisi';
        case 'konfirmasi_password':
          return 'Konfirmasi password harus diisi';
        case 'email':
          return 'Email harus diisi';
        case 'nuptk':
          return 'NUPTK harus diisi';
        case 'instansi':
          return 'Nama instansi harus diisi';
        case 'sekolah':
          return 'Sekolah harus dipilih';
        case 'kelas':
          return 'Kelas harus dipilih';
        default:
          return 'Wajib diisi';
      }
    }
    
    return error?.message || `Error: ${firstErrorKey}`;
  }
  
  /**
   * Get all error messages from control
   */
  static getAllErrorMessages(control: AbstractControl, fieldName?: string): string[] {
    if (!control.errors) return [];
    
    return Object.keys(control.errors).map(key => {
      const error = control.errors![key];
      
      // Handle required error with field name
      if (key === 'required') {
        return CustomValidators.getFirstErrorMessage(control, fieldName);
      }
      
      return error?.message || `Error: ${key}`;
    });
  }
}