
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

    // Use the Implicit OAuth flow to authenticate with the Fitbit API.
    window.location.href = `https://www.fitbit.com/oauth2/authorize?response_type=token&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes}&expires_in=${lifetime}`;
  }
}
