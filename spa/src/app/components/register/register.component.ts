
import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {

  registerForm = this.formBuilder.group({});

  constructor(private formBuilder: FormBuilder) {
  }

  ngOnInit(): void {
  }

  onSubmit(): void {
    const clientId = environment.fitbitClientId;
    const redirectUri = environment.websiteUrl
    const scopes = 'profile sleep';
    const lifetime = '86400';

    // Use the Implicit OAuth flow to authorize with the Fitbit API. This isn't
    // great since it returns the access token directly to the redirect URL, but
    // it's sufficient for our purposes and is convenient for the SPA to be able
    // to authorize itself without relying on an intermediary server.
    window.location.href = `https://www.fitbit.com/oauth2/authorize?response_type=token&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes}&expires_in=${lifetime}`;
  }
}
