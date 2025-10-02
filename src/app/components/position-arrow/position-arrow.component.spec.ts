import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PositionArrowComponent } from './position-arrow.component';

describe('MenuComponent', () => {
  let component: PositionArrowComponent;
  let fixture: ComponentFixture<PositionArrowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PositionArrowComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PositionArrowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
