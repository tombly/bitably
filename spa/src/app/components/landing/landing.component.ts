
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ApiService } from 'src/app/services/api/api.service';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})

export class LandingComponent implements OnInit {

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private apiService: ApiService) {
  }

  ngOnInit(): void {
    console.log('LandingComponent.OnInit');

    // Grab the fragment off the request URL (if there is one).
    const fragment = this.route.snapshot.fragment || '';

    // See if we got an access token via a redirect from the Fitbit API.
    let accessToken: string | null = null;
    if (fragment !== undefined) {
      console.log('Got fragment in request');
      accessToken = new URLSearchParams(fragment).get('access_token') || null;
      if (accessToken === null) {
        console.log('No token in fragment');
      }
      else {
        console.log('Got token in fragment');
      }
    }
    else {
      console.log('No fragment in request');
    }

    // Either process the token or redirect the user to register.
    if (accessToken !== null) {
      this.processToken(accessToken);
    }
    else {
      this.performRedirect();
    }
  }

  // Use the given token to obtain the user's profile from the Fitbit API and
  // then write everything to local storage and redirect the user to the home
  // page.
  processToken(accessToken: string) {
    console.log('Getting profile from Fitbit API');
    this.getProfile(accessToken).then(profile => {
      const userName = profile.user.displayName;
      const userId = profile.user.encodedId;
      console.log(`Got profile: '${userName}'/'${userId}'`);

      console.log('Writing to local storage');
      localStorage.setItem('userToken', accessToken);
      localStorage.setItem('userName', userName);
      localStorage.setItem('userId', userId);

      console.log('Calling API to register');
      this.apiService.register(userId, accessToken);

      this.performRedirect();
    });
  }

  // Check local storage to see if we have a token. If we don't, switch to
  // the register component, and if we do, switch to the home component.
  performRedirect() {
    let token = localStorage.getItem('userToken');
    if (token === null) {
      console.log('Token not found in local storage');
      this.router.navigate(['/', 'register'])
    }
    else {
      console.log(`Got token from local storage: '${token}'`);
      this.router.navigate(['/', 'home'])
    }
  }

  // Call the Fitbit API to retrieve the profile info.
  getProfile(token: string) {
    const headers = { 'Authorization': 'Bearer ' + token }
    return this.http.get<any>('https://api.fitbit.com/1/user/-/profile.json', { headers }).toPromise();
  }
}
