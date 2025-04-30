import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../component/navbar/navbar.component';
import { SidebarComponent } from '../../component/sidebar/sidebar.component';

@Component({
  selector: 'app-employee-layout',
  standalone: true,
  imports: [NavbarComponent, RouterOutlet, SidebarComponent],
  templateUrl: './employee-layout.component.html',
  styleUrl: './employee-layout.component.scss'
})
export class EmployeeLayoutComponent {

}
