import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

@Component({
    imports: [RouterOutlet],
    selector: 'app-guest',
    styleUrl: './guest.scss',
    templateUrl: './guest.html',
})
export class Guest {
    public router = inject(Router)
}
