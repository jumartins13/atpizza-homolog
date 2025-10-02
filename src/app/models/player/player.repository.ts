import { PlayerService } from "@app/services/player.service";
import { PlayerMapper } from "./player.mapper";
import { PlayerView } from "./player.view";
import { AuthService } from "@app/services/auth.service";

export class PlayerRepository {
  constructor(
    private service: PlayerService,
    private authService: AuthService
  ) { }

  getPlayers() {
    let playersView: PlayerView[];

    this.service.getPlayers().subscribe(res => {

      playersView = res.map(player => {
        return PlayerMapper.toView(player);
      });

    });

    return playersView!;
  }

  // getPlayer() {
  //   let playersView: PlayerView[];

  //   this.service.getPlayer(this.authService.userEmail).subscribe(res => {

  //     playersView = res.map( player => {
  //       return PlayerMapper.toView();
  //     });

  //   });

  //   return playersView!;
  // }
}