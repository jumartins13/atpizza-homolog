import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmationModalComponent } from './confirmation-modal.component';
import { PlayerService } from '@app/services/player.service';
import { of } from 'rxjs';
import { IMatch } from '@app/models/match/matches.model';
import { PlayerResponse } from '@app/models/player/player.dto';

describe('ConfirmationModalComponent', () => {
  let component: ConfirmationModalComponent;
  let fixture: ComponentFixture<ConfirmationModalComponent>;
  let mockPlayerService: jasmine.SpyObj<PlayerService>;

  const mockPlayers: PlayerResponse[] = [
    {
      id: '1',
      name: 'Jogador 1',
    } as PlayerResponse,
  ];

  const mockMatch: IMatch = {
    id: '123',
    groupId: 'group1',
    roundId: 'round1',
    player1: { id: '1', name: '', score: 6 },
    player2: { id: '2', name: '', score: 4 },
    winnerId: '',
  };

  beforeEach(() => {
    mockPlayerService = jasmine.createSpyObj('PlayerService', ['getPlayers']);

    TestBed.configureTestingModule({
      imports: [ConfirmationModalComponent],
      providers: [{ provide: PlayerService, useValue: mockPlayerService }],
    });

    mockPlayerService.getPlayers.and.returnValue(of(mockPlayers));

    fixture = TestBed.createComponent(ConfirmationModalComponent);
    component = fixture.componentInstance;
    component.match = mockMatch;
    fixture.detectChanges();
  });

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  it('deve buscar jogadores no ngOnInit', () => {
    expect(mockPlayerService.getPlayers).toHaveBeenCalled();
  });

  it('deve atualizar scores e botão no ngOnChanges', () => {
    component.ngOnChanges({
      match: {
        currentValue: mockMatch,
        previousValue: null,
        firstChange: true,
        isFirstChange: () => true,
      },
    });
    expect(component.score1updated).toBe(6);
    expect(component.score2updated).toBe(4);
    expect(component.activeButton).toBeTrue();
  });

  it('deve emitir closeModalEvent ao fechar modal', () => {
    spyOn(component.closeModalEvent, 'emit');
    component.closeModal();
    expect(component.closeModalEvent.emit).toHaveBeenCalled();
  });

  it('deve calcular corretamente o vencedor', () => {
    const winner = component.winnerPlayer(6, 4, '1', '2');
    expect(winner).toBe('1');
  });

  it('deve validar scores corretamente', () => {
    expect(component.isValidScore(6, 0)).toBeTrue();
    expect(component.isValidScore(7, 5)).toBeTrue();
    expect(component.isValidScore(3, 3)).toBeFalse();
    expect(component.isValidScore('W.O', 6)).toBeTrue();
    expect(component.isValidScore('W.O', 'W.O')).toBeTrue();
  });

  it('deve retornar o nome do jogador corretamente', () => {
    expect(component.getPlayerName('1')).toBe('Player 1');
    expect(component.getPlayerName('3')).toBe('Desconhecido');
    expect(component.getPlayerName(undefined)).toBe('Desconhecido');
  });

  it('deve emitir evento com partida salva', () => {
    component.match = {
      id: '123',
      player1: { id: '1', name: 'Player 1', score: 0 },
      player2: { id: '2', name: 'Player 2', score: 0 },
      groupId: 'g1',
      roundId: 'r1',
    };
  
    component['players'] = [
      { id: '1', name: 'Player 1' } as any,
      { id: '2', name: 'Player 2' } as any,
    ];
  
    component.score1updated = 6;
    component.score2updated = 2;
  
    spyOn(component.saveMatchEvent, 'emit');
  
    component.saveMatch();
  
    expect(component.saveMatchEvent.emit).toHaveBeenCalled();
  
    const matchEmitido = (component.saveMatchEvent.emit as jasmine.Spy).calls.mostRecent().args[0];
  
    expect(matchEmitido.player1.name).toBe('Player 1');
    expect(matchEmitido.player1.score).toBe(6);
    expect(matchEmitido.winnerId).toBe('1');
  });

  it('deve cancelar saveMatch se não houver partida', () => {
    component.match = null;
    spyOn(console, 'log');
    component.saveMatch();
    expect(console.log).toHaveBeenCalledWith('ERRO');
  });

  it('deve desinscrever no ngOnDestroy', () => {
    component.ngOnDestroy();
    expect(component['playerSubscription']?.closed).toBeTrue();
  });
});
