import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss']
})
export class ToastComponent implements OnInit {
  @Input() message = '';
  @Input() type: 'success' | 'error' | 'info' = 'success';
  @Input() duration = 3000;

  visible = true;

  ngOnInit(): void {
    setTimeout(() => {
      this.visible = false;
    }, this.duration + 500);
  }
}
