import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-servicios',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './servicios.component.html',
  styleUrls: ['./servicios.component.css']
})
export class ServiciosComponent {
  // Este archivo es solo visual: no hay lógica ni datos dinámicos
}