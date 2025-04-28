import { CommonModule } from '@angular/common';
import { Component, Input, input } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
@Input() role:string="";

constructor(private router:Router) {
  
}

logout(){
  localStorage.clear();
  this.router.navigate(['login'])
 
}
}
