import { Component, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { I18nService } from '../../../core/i18n/i18n.service';

@Component({
    imports: [FormsModule],
    selector: 'app-register',
    styleUrl: './register.scss',
    templateUrl: './register.html',
})
export class Register {
    public readonly i18n = inject(I18nService);
    public submitted = false;

    public submit(_form: NgForm): void {
        this.submitted = true;
    }
}
