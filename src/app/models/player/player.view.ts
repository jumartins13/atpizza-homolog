// o que o usuário visualiza

import { EBackHand, EMainHand } from "./player.enum";

export interface PlayerView {
    id: string;
    name: string;
    groupId: string;
    personalDetails: {
        height: number;
        startOfTheRanking: number;
        socialNetwork: string;
        country: string;
        mainHand: EMainHand;
        backHand: EBackHand;
    }
}
