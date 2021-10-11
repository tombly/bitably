
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface SleepCountDto {
  count: number;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private http: HttpClient) {
  }

  sleepDayCount(userId: string): Observable<SleepCountDto> {
    console.log(`sleepDayCount(${userId})`)
    return this.http.get<SleepCountDto>(`${environment.apiUrl}/sleep/days/count?userId=${userId}`);
  }

  register(userId: string, token: string): void {
    console.log(`register(${userId}, ${token})`)
    const url = `${environment.apiUrl}/register?userId=${userId}&token=${token}`;
    this.http.get<any>(url).subscribe(data => {
      console.log(`Registration result: ${data}`);
    });
  }
}
