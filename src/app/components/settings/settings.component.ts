import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {

  currentTheme: string = 'default';

  setTheme(theme: string) {

    const body = document.body;

    body.classList.remove('dark', 'barber');

    if (theme !== 'default') {
      body.classList.add(theme);
    }

    localStorage.setItem('theme', theme);
    this.currentTheme = theme;
  }

  ngOnInit() {
    const theme = localStorage.getItem('theme') || 'default';

    if (theme !== 'default') {
      document.body.classList.add(theme);
    }

    this.currentTheme = theme;
  }

  isActive(theme: string): boolean {
    return this.currentTheme === theme;
  }
}