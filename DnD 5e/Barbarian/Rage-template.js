//default template to use for each sub class, default areas to be used for features at each level

//template for barbarian rages

//catch all to end script if no token selected
if (!token)
    return;
	
	
	
//////////////////////////////////////////////////////////////////////////////////////////////////////////
const rageResourceName = "Rage"; // change this to what the Barbarian has as resource name on their sheet.
const effectRageLabel = "Rage";
//////////////////////////////////////////////////////////////////////////////////////////////////////////



//////////////////////////////////////////////////////////////////////////////////////////////////////////
//Primal path features
//3rd level - description

//6th level - description

//10th level - description

//14th level - description

//////////////////////////////////////////////////////////////////////////////////////////////////////////



//begin code
let hasAvailableResource = false;

const level = actor.data.type === "npc" ? actor.data.data.details.cr : actor.items.find(i => i.name === "Barbarian" && i.type === "class").data.data.levels;
let gameRound = game.combat ? game.combat.round : 0;
let message = "";
const effectRage = actor.effects.find(e => e.data.label === effectRageLabel);



Rage();

async function Rage() {

    if (effectRage) {
        //end rage if already active
        message = `<i>${actor.name} is no longer raging.</i>`;
        let rageId = effectRage.id;
        await actor.deleteEmbeddedDocuments("ActiveEffect", [rageId]);
    } else {
        //update rage values
        const resourceKey = Object.keys(token.actor.data.data.resources).filter(k => token.actor.data.data.resources[k].label === `${rageResourceName}`).shift();
        console.log(resourceKey)
        if (resourceKey && token.actor.data.data.resources[resourceKey].value > 0)
            hasAvailableResource = true;
        if (!hasAvailableResource)
            return ui.notifications.warn("You are out of charges to Rage.");
        const effectRageData = {
            label: "Rage",
            icon: "systems/dnd5e/icons/skills/affliction_24.jpg",
            changes: [{
                    "key": "data.bonuses.mwak.damage",
                    "value": `+${(Math.ceil(Math.floor(level/(9-(Math.floor(level/9)))+2)))}`,
                    "mode": 2,
                    "priority": 20
                }, {
                    "key": "data.traits.dr.value",
                    "value": "slashing",
                    "mode": 2,
                    "priority": 20
                }, {
                    "key": "data.traits.dr.value",
                    "value": "bludgeoning",
                    "mode": 2,
                    "priority": 20
                }, {
                    "key": "data.traits.dr.value",
                    "value": "piercing",
                    "mode": 2,
                    "priority": 20
                }
            ],
            disabled: false,
            duration: {
                rounds: 10,
                seconds: 60,
                startRound: gameRound,
                startTime: game.time.worldTime
            },
        };

        //recalculate rage
        let newResources = duplicate(actor.data.data.resources);
        newResources[resourceKey].value--;
        await actor.update({
            "data.resources": newResources
        });

        await createEffects(effectRageData);
        message = `<em>${actor.name} is RAAAAAAAGING!</em>`;
    }
    //issue message for start or end of rage
    chatMessage(message);
}



function chatMessage(message) {
    ChatMessage.create({
        user: game.user.id,
        speaker: ChatMessage.getSpeaker({
            actor
        }),
        content: message,
        type: CONST.CHAT_MESSAGE_TYPES.EMOTE
    });

};


async function createEffects(effect) {
    await actor.createEmbeddedDocuments("ActiveEffect", [effect]);
};


