import { Component } from '@angular/core';
import { NavbarComponent } from '../../component/navbar/navbar.component';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../component/sidebar/sidebar.component';

@Component({
  selector: 'app-user-layout',
  standalone: true,
  imports: [NavbarComponent, RouterOutlet, SidebarComponent],
  templateUrl: './user-layout.component.html',
  styleUrl: './user-layout.component.scss'
})
export class UserLayoutComponent {

}
