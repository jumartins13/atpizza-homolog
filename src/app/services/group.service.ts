import { Injectable } from '@angular/core';
import { Firestore, collection, getDocs, doc, getDoc, query, limit } from '@angular/fire/firestore';
import { Observable, from, map, forkJoin, of, switchMap, combineLatest, catchError } from 'rxjs';
import { ISelectItem } from '@models/select/select.model';
import { RoundService } from './round.service';

@Injectable({
  providedIn: 'root'
})
export class GroupService {
  private groupNames: Record<string, string> = {
    'A': 'Grupo A',
    'B': 'Grupo B', 
    'C': 'Grupo C',
    'D': 'Grupo D',
    'E': 'Grupo E',
    'F': 'Grupo F',
    'G': 'Grupo G',
    'H': 'Grupo H',
    'I': 'Grupo I',
    'J': 'Grupo J',
    'K': 'Grupo K',
    'L': 'Grupo L',
    'M': 'Grupo M',
    'N': 'Grupo N',
    'O': 'Grupo O',
    'P': 'Grupo P',
    'Q': 'Grupo Q',
    'R': 'Grupo R',
    'S': 'Grupo S',
    'T': 'Grupo T',
    'U': 'Grupo U',
    'V': 'Grupo V',
  };

  private groupLinks: Record<string, string> = {
    'A': 'https://chat.whatsapp.com/EqI1TL3BYPA83XKFLCDtGB?mode=ems_copy_t',
    'B': 'https://chat.whatsapp.com/D413iGZvEwe0MbJLgrNmcr?mode=ems_copy_t',
    'C': 'https://chat.whatsapp.com/BY5LNhvKbwF0enC3zuUKA7?mode=ems_copy_t',
    'D': 'https://chat.whatsapp.com/Ih7j2UxrCXt3pbQ3fu3gUt?mode=ems_copy_t',
    'E': 'https://chat.whatsapp.com/GmvH0KQyugJ4Rz3vBfDpiC?mode=ems_copy_t',
    'F': 'https://chat.whatsapp.com/E3xtOToznVO7bjhiTIrBwU?mode=ems_copy_t',
    'G': 'https://chat.whatsapp.com/Hzq6PxB9Zmd7bNeWxT7IiP?mode=ems_copy_t',
    'H': 'https://chat.whatsapp.com/IyY4erDM1w9DcrquMcnOD0?mode=ems_copy_t',
    'I': 'https://chat.whatsapp.com/HzF9al4zhUxANiTew22WrY?mode=ems_copy_t'  
  };

  constructor(private firestore: Firestore, private roundService: RoundService) {}

  getAvailableGroups(): Observable<ISelectItem[]> {
    // Busca jogadores na coleção players e verifica quais grupos têm jogadores
    const playersRef = collection(this.firestore, 'players');
    
    return from(getDocs(playersRef)).pipe(
      map(querySnapshot => {
        const groupsWithPlayers = new Set<string>();
        
        // console.log(`📊 Total de jogadores encontrados: ${querySnapshot.size}`);
        
        querySnapshot.forEach(doc => {
          const playerData = doc.data();
          // console.log(`👤 Jogador ${doc.id}:`, playerData);
          
          const groupId = ['groupId'];
          let foundGroup = false;
          
          for (const field of groupId) {
            if (playerData && playerData[field]) {
              const groupId = playerData[field];
              groupsWithPlayers.add(groupId);
              // console.log(`✅ Jogador ${playerData['name'] || doc.id} está no ${field}: ${groupId}`);
              foundGroup = true;
              break;
            }
          }
          
          if (!foundGroup) {
            // console.log(`❌ Jogador ${playerData['name'] || doc.id} não tem grupo definido`);
          }
        });
        
        const availableGroups = Array.from(groupsWithPlayers).sort();
        // console.log('💾 Grupos com jogadores:', availableGroups);
        
        return availableGroups.map(groupId => ({
          name: this.groupNames[groupId] || `Grupo ${groupId}`,
          value: groupId,
          link: this.groupLinks[groupId]
        }));
      })
    );
  }


  // Método mais avançado que verifica se o grupo tem matches
  getAvailableGroupsWithMatches(): Observable<ISelectItem[]> {
    const groupsRef = collection(this.firestore, 'groups');
    
    return from(getDocs(groupsRef)).pipe(
      switchMap(querySnapshot => {
        const groupChecks: Observable<string | null>[] = [];
        
        querySnapshot.forEach(doc => {
          const groupId = doc.id;
          const matchesRef = collection(this.firestore, `groups/${groupId}/matches`);
          const matchesQuery = query(matchesRef, limit(1));
          
          const hasMatches = from(getDocs(matchesQuery)).pipe(
            map(matchSnapshot => {
              const hasData = !matchSnapshot.empty;
              // console.log(`Group ${groupId} has matches:`, hasData);
              return hasData ? groupId : null;
            })
          );
          
          groupChecks.push(hasMatches);
        });
        
        return forkJoin(groupChecks);
      }),
      map(results => {
        const activeGroups = results.filter(groupId => groupId !== null) as string[];
        // console.log('Active groups with matches:', activeGroups);
        
        return activeGroups.map(groupId => ({
          name: this.groupNames[groupId] || `Grupo ${groupId}`,
          value: groupId,
          link: this.groupLinks[groupId]
        }));
      })
    );
  }

  // Método que verifica se o grupo tem leaderboard ativo na rodada atual
  getAvailableGroupsWithLeaderboards(): Observable<ISelectItem[]> {
    return this.getAvailableGroups().pipe(
      switchMap(groups => {
        if (groups.length === 0) return of([]);
        
        // Primeiro, vamos descobrir qual é a rodada atual mais comum
        const roundChecks = groups.map(group => 
          this.roundService.getLatestRoundId$(group.value).pipe(
            map(roundId => ({ group: group.value, roundId }))
          )
        );
        
        return forkJoin(roundChecks).pipe(
          switchMap(groupRounds => {
            // console.log('🔄 Group rounds:', groupRounds);
            
            // Encontra a rodada mais comum (rodada atual)
            const roundCounts = groupRounds.reduce((acc, { roundId }) => {
              if (roundId) {
                acc[roundId] = (acc[roundId] || 0) + 1;
              }
              return acc;
            }, {} as Record<string, number>);
            
            const currentRoundId = Object.keys(roundCounts).reduce((a, b) => 
              roundCounts[a] > roundCounts[b] ? a : b, Object.keys(roundCounts)[0]
            );
            
            // console.log('🎯 Current round ID (most common):', currentRoundId);
            // console.log('📊 Round counts:', roundCounts);
            
            // Agora verifica leaderboards apenas para grupos na rodada atual
            const leaderboardChecks = groups
              .filter(group => {
                const groupRound = groupRounds.find(gr => gr.group === group.value);
                const isCurrentRound = groupRound?.roundId === currentRoundId;
                // console.log(`🔍 Group ${group.value} - Round: ${groupRound?.roundId}, Is current: ${isCurrentRound}`);
                return isCurrentRound;
              })
              .map(group => {
                const leaderboardDocId = `${group.value}_${currentRoundId}`;
                const leaderboardDocRef = doc(this.firestore, `leaderboard/${leaderboardDocId}`);
                // console.log(`🔍 Checking leaderboard document: ${leaderboardDocId}`);
                
                return from(getDoc(leaderboardDocRef)).pipe(
                  map(docSnap => {
                    const hasLeaderboard = docSnap.exists();
                    // console.log(`🎯 Group ${group.value} has current round leaderboard: ${hasLeaderboard}`);
                    
                    if (!hasLeaderboard) {
                      // console.log(`❌ Group ${group.value} - NO current leaderboard - EXCLUDED`);
                      return null;
                    }
                    
                    const data = docSnap.data();
                    const hasValidData = data && Array.isArray(data['data']) && data['data'].length > 0;
                    // console.log(`✅ Group ${group.value} - Valid data: ${hasValidData} - ${hasValidData ? 'INCLUDED' : 'EXCLUDED'}`);
                    
                    return hasValidData ? group : null;
                  }),
                  catchError(error => {
                    console.error(`❌ Error checking leaderboard for group ${group.value}:`, error);
                    return of(null);
                  })
                );
              });
            
            return leaderboardChecks.length > 0 ? forkJoin(leaderboardChecks) : of([]);
          })
        );
      }),
      map(results => {
        const groupsWithLeaderboards = results.filter(group => group !== null) as ISelectItem[];
        // console.log('✅ Final groups with CURRENT round leaderboards:', groupsWithLeaderboards.map(g => g.value));
        return groupsWithLeaderboards;
      })
    );
  }

  // Método alternativo que verifica cada grupo individualmente
  getAvailableGroupsAlternative(): Observable<ISelectItem[]> {
    const possibleGroups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
    
    const checkGroup = (groupId: string): Observable<boolean> => {
      const groupDocRef = doc(this.firestore, `groups/${groupId}`);
      return from(getDoc(groupDocRef)).pipe(
        map(docSnap => {
          const exists = docSnap.exists();
          // console.log(`Group ${groupId} exists:`, exists);
          return exists;
        })
      );
    };

    const groupChecks = possibleGroups.map(groupId => 
      checkGroup(groupId).pipe(
        map(exists => exists ? groupId : null)
      )
    );

    return forkJoin(groupChecks).pipe(
      map(results => {
        const existingGroups = results.filter(groupId => groupId !== null) as string[];
        // console.log('Existing groups (alternative method):', existingGroups);
        
        return existingGroups.map(groupId => ({
          name: this.groupNames[groupId] || `Grupo ${groupId}`,
          value: groupId,
          link: this.groupLinks[groupId]
        }));
      })
    );
  }
}