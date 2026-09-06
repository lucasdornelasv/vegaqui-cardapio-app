import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LeafPatternComponent } from '@components/leaf-pattern/leaf-pattern';

@Component({
  imports: [RouterOutlet, LeafPatternComponent],
  selector: 'root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class AppComponent {}
