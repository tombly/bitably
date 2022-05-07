
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
  scoreCount?: number = undefined;
  userName: string = '';
  userId: string = '';
  signOutForm = this.formBuilder.group({});
  fetchForm = this.formBuilder.group({});

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private apiService: ApiService) {
  }

  ngOnInit(): void {
    this.userName = localStorage.getItem('userName') || '[name]';
    this.userId = localStorage.getItem('userId') || '';

    this.apiService.sleepDayCount(this.userId).subscribe(response => {
      this.dayCount = response.count;
    });

    this.apiService.hourStreak(this.userId).subscribe(response => {
      this.scoreCount = response.count;
    });
  }

  onSignOut(): void {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');

    this.router.navigate(['/', 'landing'])
  }

  onFetch(): void {
    this.apiService.fetch(this.userId);
  }
}
