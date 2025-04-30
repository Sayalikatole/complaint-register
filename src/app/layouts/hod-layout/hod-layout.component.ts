import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../component/navbar/navbar.component';
import { SidebarComponent } from '../../component/sidebar/sidebar.component';

@Component({
  selector: 'app-hod-layout',
  standalone: true,
  imports: [NavbarComponent, RouterOutlet, SidebarComponent],
  templateUrl: './hod-layout.component.html',
  styleUrl: './hod-layout.component.scss'
})
export class HodLayoutComponent {

}
