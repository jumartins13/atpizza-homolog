import { Component } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { CommonModule } from '@angular/common';
import { FloatingCircleComponent } from "../../components/floating-circle/floating-circle.component";

@Component({
  selector: 'app-pizza',
  standalone: true,
  imports: [CommonModule, FloatingCircleComponent],
  providers: [AngularFireAuth],
  templateUrl: './pizza.component.html',
  styleUrl: './pizza.component.scss',
})
export class PizzaComponent {
  
}