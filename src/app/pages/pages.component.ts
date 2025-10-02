import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { MenuComponent } from '../components/menu/menu.component';
// import { HomeComponent } from './home/home.component';
import { SideMenuModule } from "@components/side-menu/side-menu.module";

@Component({
  selector: 'app-pages',
  standalone: true,
  imports: [RouterOutlet, MenuComponent, SideMenuModule],
  templateUrl: './pages.component.html',
  styleUrl: './pages.component.scss',
})
export class PagesComponent {

}
