import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';

declare const HSSelect: any; // Preline Select component

declare global {
  interface Window {
    HSSelect: typeof HSSelect;
  }
}

@Component({
  selector: 'app-configuration',
  standalone: true,
  templateUrl:'./configuration.component.html',
  styleUrls: ['./configuration.component.css'],
  imports: [
       
        CommonModule,
       
        
    ],
})
export class ConfigurationComponent implements AfterViewInit {
  person: string = '';
  role: string = '';
  peopleList: { person: string, role: string }[] = [];

  ngAfterViewInit() {
    // Wait for Angular to render, then initialize Preline dropdowns
    setTimeout(() => {
      if (window['HSSelect']) {
        window['HSSelect'].autoInit();
      }
    }, 200);
  }

  addPerson() {
    // Get selected values manually (because Preline manages hidden <select>)
    const personSelect = document.querySelector<HTMLSelectElement>('[name="person"]');
    const roleSelect = document.querySelector<HTMLSelectElement>('[name="role"]');
    const selectedPerson = personSelect?.value || '';
    const selectedRole = roleSelect?.value || '';

    if (selectedPerson && selectedRole) {
      this.peopleList.push({ person: selectedPerson, role: selectedRole });

      // Reset selects visually
      personSelect!.value = '';
      roleSelect!.value = '';
      window['HSSelect'].autoInit();
    }
  }

  removePerson(index: number) {
    this.peopleList.splice(index, 1);
  }
}
