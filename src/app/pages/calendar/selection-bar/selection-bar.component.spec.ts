import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SelectionBarComponent } from './selection-bar.component';


describe('StatsComponent', () => {
  let component: SelectionBarComponent;
  let fixture: ComponentFixture<SelectionBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectionBarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SelectionBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
