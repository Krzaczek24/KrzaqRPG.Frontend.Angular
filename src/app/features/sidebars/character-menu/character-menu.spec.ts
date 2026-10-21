import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CharacterMenu } from './character-menu';

describe('CharacterMenu', () => {
    let component: CharacterMenu;
    let fixture: ComponentFixture<CharacterMenu>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CharacterMenu],
        }).compileComponents();

        fixture = TestBed.createComponent(CharacterMenu);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
