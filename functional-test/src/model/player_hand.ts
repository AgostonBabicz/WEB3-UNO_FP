import { List } from "immutable";
import { Card, Color, isColored } from "./deck";

export class PlayerHand {
    readonly playerHand : List<Card>

    constructor(playerHand:List<Card>){
        this.playerHand = playerHand
    }

    add(card:Card):PlayerHand{
        return new PlayerHand(this.playerHand.push(card))
    }

    getPlayerHand():List<Card>{
        return this.playerHand
    }

    playCard(cardIx:number) : [Card|undefined,PlayerHand]{
        const card = this.playerHand.get(cardIx)
        return [card,  new PlayerHand(this.playerHand.remove(cardIx))]
    }

    size() : number{
        return this.playerHand.size
    }

    hasColor(color : Color) : boolean{
        return this.playerHand.some(c=>isColored(c) && c.color === color)
    }
}