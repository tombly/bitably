
import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from 'src/app/services/api/api.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  dayCount?: number = undefined;
  userName: string = '';
  signOutForm = this.formBuilder.group({});

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private apiService: ApiService) {
  }

  ngOnInit(): void {
    this.userName = localStorage.getItem('userName') || '[name]';

    const userId: string = localStorage.getItem('userId') || '';

    this.apiService.sleepDayCount(userId).subscribe(sleepCount => {
      this.dayCount = sleepCount.count;
    });
  }

  onSignOut(): void {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');

    this.router.navigate(['/', 'landing'])
  }
}
