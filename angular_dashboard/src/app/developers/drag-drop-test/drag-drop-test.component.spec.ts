import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DragDropTestComponent } from './drag-drop-test.component';

describe('DragDropTestComponent', () => {
  let component: DragDropTestComponent;
  let fixture: ComponentFixture<DragDropTestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DragDropTestComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DragDropTestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
