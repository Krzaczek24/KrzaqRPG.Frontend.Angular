import { Component, inject } from '@angular/core';
import { I18nService } from '../../../core/i18n/i18n.service';

@Component({
    imports: [],
    selector: 'app-register',
    styleUrl: './register.scss',
    templateUrl: './register.html',
})
export class Register {
    public readonly i18n = inject(I18nService);}
