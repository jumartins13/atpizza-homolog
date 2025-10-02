import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SelectComponent } from './select.component';
import { ISelectItem } from '@models/select/select.model';

describe('SelectComponent', () => {
  let component: SelectComponent;
  let fixture: ComponentFixture<SelectComponent>;

  const mockItems: ISelectItem[] = [
    { name: 'Opção 1', value: '1' },
    { name: 'Opção 2', value: '2' }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SelectComponent);
    component = fixture.componentInstance;
    component.items = mockItems;
    fixture.detectChanges();
  });

  it('deve ser criado', () => {
    expect(component).toBeTruthy();
  });

  it('deve setar o primeiro item como selecionado se não tiver selectedItem', () => {
    expect(component.selectedItem).toEqual(mockItems[0]);
  });

  it('deve alternar o estado do select', () => {
    expect(component.isSelectOpen).toBeFalse();
    component.toggleSelect();
    expect(component.isSelectOpen).toBeTrue();
    component.toggleSelect();
    expect(component.isSelectOpen).toBeFalse();
  });

  it('deve emitir itemSelected ao selecionar um item', () => {
    spyOn(component.itemSelected, 'emit');

    const item = mockItems[1];
    component.selectItem(item);

    expect(component.itemSelected.emit).toHaveBeenCalledWith(item);
    expect(component.isSelectOpen).toBeFalse();
  });

  it('deve fechar o select com delay no blur', (done) => {
    component.isSelectOpen = true;
    component.onBlur();

    setTimeout(() => {
      expect(component.isSelectOpen).toBeFalse();
      done();
    }, 160); // maior que os 150ms
  });
});
