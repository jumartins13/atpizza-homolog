import { PlayerView } from "./player.view";
import { PlayerResponse } from "./player.dto";
import { EBackHand, EMainHand } from "./player.enum";

export class PlayerMapper {

  static toView(response: PlayerResponse): PlayerView {
    const player: PlayerView = {
      id: response.id,
      name: response.name,
      groupId: response.groupId,
      personalDetails: {
        country: response.details.country,
        height: Number(response.details.height),
        mainHand: response.details.mainHand === 'Destro' ? EMainHand.L : EMainHand.R,
        backHand: response.details.backHand === 'Uma mão' ? EBackHand.ONE : EBackHand.TWO,
        startOfTheRanking: new Date().getTime(),
        socialNetwork: response.details.socialNetwork,
      }
    }

    return player;
  }

}