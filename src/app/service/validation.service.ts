import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { UserService, UserBasicInfo } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class ValidationService {
  private usersData: UserBasicInfo[] = [];
  private dataLoaded = new BehaviorSubject<boolean>(false);
  private loading = new BehaviorSubject<boolean>(false);

  constructor(private userService: UserService) {
    this.loadUsersData();
  }

  // ✅ Load data saat service diinisialisasi
  private loadUsersData(): void {
    this.loading.next(true);
    this.userService.getAllUserBasicInfo().subscribe({
      next: (response) => {
        console.log('✅ Users basic info loaded:', response);
        if (response.success && response.data) {
          this.usersData = response.data;
          this.dataLoaded.next(true);
        } else {
          this.usersData = [];
          this.dataLoaded.next(false);
        }
        this.loading.next(false);
      },
      error: (error) => {
        console.error('❌ Error loading users basic info:', error);
        this.usersData = [];
        this.dataLoaded.next(false);
        this.loading.next(false);
      }
    });
  }

  // ✅ Observable untuk mengetahui kapan data sudah loaded
  get isDataLoaded(): Observable<boolean> {
    return this.dataLoaded.asObservable();
  }

  // ✅ Observable untuk loading state
  get isLoading(): Observable<boolean> {
    return this.loading.asObservable();
  }

  // ✅ Refresh data (untuk dipanggil setelah registrasi berhasil)
  refreshUsersData(): void {
    this.loadUsersData();
  }

  // ✅ Get raw data for debugging
  getUsersData(): UserBasicInfo[] {
    return [...this.usersData]; // Return copy to prevent mutation
  }

  // ============= USERNAME VALIDATION =============
  
  isUsernameTaken(username: string, excludeId?: string): boolean {
    if (!username || username.trim() === '') return false;
    
    const normalizedUsername = username.toLowerCase().trim();
    return this.usersData.some(user => 
      user.username.toLowerCase() === normalizedUsername && 
      user._id !== excludeId
    );
  }

  getUsernameSuggestions(baseUsername: string, maxSuggestions: number = 3): string[] {
    if (!baseUsername || baseUsername.trim() === '') return [];
    
    const suggestions: string[] = [];
    const cleanBase = baseUsername.toLowerCase().trim();
    let counter = 1;
    
    // Add number suffix suggestions
    while (suggestions.length < maxSuggestions && counter <= 999) {
      const suggestion = `${cleanBase}${counter}`;
      if (!this.isUsernameTaken(suggestion)) {
        suggestions.push(suggestion);
      }
      counter++;
    }
    
    // Add underscore variations if still need more
    if (suggestions.length < maxSuggestions) {
      const underscoreVariations = [`${cleanBase}_1`, `${cleanBase}_user`, `user_${cleanBase}`];
      for (const variation of underscoreVariations) {
        if (suggestions.length >= maxSuggestions) break;
        if (!this.isUsernameTaken(variation)) {
          suggestions.push(variation);
        }
      }
    }
    
    return suggestions;
  }

  // ============= EMAIL VALIDATION =============
  
  isEmailTaken(email: string, excludeId?: string): boolean {
    if (!email || email.trim() === '') return false;
    
    const normalizedEmail = email.toLowerCase().trim();
    return this.usersData.some(user => 
      user.email && 
      user.email.toLowerCase() === normalizedEmail && 
      user._id !== excludeId
    );
  }

  getEmailSuggestions(baseEmail: string): string[] {
    if (!baseEmail || !baseEmail.includes('@')) return [];
    
    const [localPart, domain] = baseEmail.split('@');
    const suggestions: string[] = [];
    
    // Common domain suggestions
    const commonDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];
    
    for (let i = 1; i <= 3; i++) {
      const suggestion = `${localPart}${i}@${domain}`;
      if (!this.isEmailTaken(suggestion)) {
        suggestions.push(suggestion);
      }
    }
    
    // Domain variations if not common domain
    if (!commonDomains.includes(domain.toLowerCase())) {
      for (const commonDomain of commonDomains.slice(0, 2)) {
        const suggestion = `${localPart}@${commonDomain}`;
        if (!this.isEmailTaken(suggestion) && suggestions.length < 3) {
          suggestions.push(suggestion);
        }
      }
    }
    
    return suggestions;
  }

  // ============= NUPTK VALIDATION =============
  
  isNuptkTaken(nuptk: string, excludeId?: string): boolean {
    if (!nuptk || nuptk.trim() === '') return false;
    
    // Remove all non-digit characters for comparison
    const cleanNuptk = nuptk.replace(/\D/g, '');
    
    return this.usersData.some(user => 
      user.nuptk && 
      user.nuptk.replace(/\D/g, '') === cleanNuptk && 
      user._id !== excludeId
    );
  }

  // ✅ Check if NUPTK has valid format (16 digits)
  isValidNuptkFormat(nuptk: string): boolean {
    if (!nuptk) return false;
    const digits = nuptk.replace(/\D/g, '');
    return digits.length === 16;
  }

  // ✅ Format NUPTK with dashes for display (xxxx-xxxx-xxxx-xxxx)
  formatNuptk(nuptk: string): string {
    const digits = nuptk.replace(/\D/g, '');
    if (digits.length <= 4) return digits;
    if (digits.length <= 8) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    if (digits.length <= 12) return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8)}`;
    return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8, 12)}-${digits.slice(12, 16)}`;
  }

  // ============= GENERAL VALIDATION STATS =============
  
  getValidationStats(): {
    totalUsers: number;
    totalStudents: number;
    totalTeachers: number;
    uniqueUsernames: number;
    uniqueEmails: number;
    uniqueNuptks: number;
  } {
    const stats = {
      totalUsers: this.usersData.length,
      totalStudents: this.usersData.filter(u => u.role === 'siswa').length,
      totalTeachers: this.usersData.filter(u => u.role === 'guru').length,
      uniqueUsernames: new Set(this.usersData.map(u => u.username.toLowerCase())).size,
      uniqueEmails: new Set(this.usersData.filter(u => u.email).map(u => u.email!.toLowerCase())).size,
      uniqueNuptks: new Set(this.usersData.filter(u => u.nuptk).map(u => u.nuptk!)).size
    };
    
    console.log('📊 Validation Stats:', stats);
    return stats;
  }
}