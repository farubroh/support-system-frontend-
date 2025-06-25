import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-create-issue',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-issue.component.html',
  styleUrls: ['./create-issue.component.css']
})
export class CreateIssueComponent {
  form = {
    title: '',
    description: ''
  };

  constructor(public router: Router) {}

  handleSubmit() {
    alert('Issue submitted!');
    this.router.navigate(['/dashboard']);
  }
}
