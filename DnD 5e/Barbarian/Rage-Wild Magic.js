//credit to https://gitlab.com/Freeze020/foundry-vtt-scripts


if (!token)
    return;
//////////////////////////////////////////////////////////////////////////////////////////////////////////
const rageResourceName = "Rage"; // change this to what the Barbarian has as resource name on their sheet.
const effectRageLabel = "Rage";
const effectWildMagicRageLabel = "Wild Magic Rage";

const useWildMagic = true; //set to true to cast wild magic when raging
const spellDC = 8 + actor.data.data.attributes.prof + actor.data.data.abilities.con.mod;

//////////////////////////////////////////////////////////////////////////////////////////////////////////
//optional use of token-auras
const moduleTokenAuras = game.modules.get("token-auras");
const useTokenAuras = true;

//////////////////////////////////////////////////////////////////////////////////////////////////////////
//predefined button arrays for use in popup
const diceIcon = '<i class="fas fa-dice-d20"></i>';
const dialogStyle =  `
					<style>
                      #controlled-surge .dialog-buttons {
                          flex-direction: column;
                      }
                  </style>
                  `;
				  
buttonsControlledSurge8 = {

    1: {
        icon: diceIcon,
        label: "Shadowy Tendrils",
        callback: () => rollWildMagic(1),
    },
    2: {
        icon: diceIcon,
        label: "Teleport",
        callback: () => rollWildMagic(2),
    },
    3: {
        icon: diceIcon,
        label: "Exploding Sprite",
        callback: () => rollWildMagic(3),
    },
    4: {
        icon: diceIcon,
        label: "Boomerang Weapons",
        callback: () => rollWildMagic(4),
    },
    5: {
        icon: diceIcon,
        label: "Retribution Aura",
        callback: () => rollWildMagic(5),
    },
    6: {
        icon: diceIcon,
        label: "Protection Aura",
        callback: () => rollWildMagic(6),
    },
    7: {
        icon: diceIcon,
        label: "Vines",
        callback: () => rollWildMagic(7),
    },
    8: {
        icon: diceIcon,
        label: "Iron Man",
        callback: () => rollWildMagic(8),
    }
}
buttonsUnstableBacklash = {

    1: {
        icon: '<i class="fas fa-times"></i>',
        label: "End Rage",
        callback: () => Rage(),
    },
    2: {
        icon: diceIcon,
        label: "Re Roll Wild Magic",
        callback: () => rollWildMagic(),
    }
}

buttonsControlledSurge = {

    1: {
        icon: '<i class="fas fa-times"></i>',
        label: "End Rage",
        callback: () => Rage(),
    },
    2: {
        icon: diceIcon,
        label: "Re Roll Wild Magic",
        callback: () => controlledSurge(),
    }
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////
//begin code
let hasAvailableResource = false;

const level = actor.data.type === "npc" ? actor.data.data.details.cr : actor.items.find(i => i.name === "Barbarian" && i.type === "class").data.data.levels;
let gameRound = game.combat ? game.combat.round : 0;
let message = "";
const effectRage = actor.effects.find(e => e.data.label === effectRageLabel);
const effectWildMagicRage = actor.effects.find(e => e.data.label === effectWildMagicRageLabel);


//initiate rolls and checks
if (level>=3 && level<10 && useWildMagic ){
	if (effectRage) {
			Rage();
		}else{
			Rage();
			rollWildMagic();
		}
		
}else if (level>=10 && level<14 && useWildMagic) {
		if (effectRage) {
			//prompt for reroll
			dialogContent = "<p>When you are imperiled during your rage, the magic within you can lash out; immediately after you take damage or fail a saving throw while raging, you can use your reaction to roll on the Wild Magic table and immediately produce the effect rolled. This effect replaces your current Wild Magic effect.</p>",       
			rageDialog = await dialogPopUp("Unstable Backlash",dialogContent,buttonsUnstableBacklash)
			rageDialog.render(true);
		}else{
			Rage();
			rollWildMagic();
		}
	
}else if (level>=14 && useWildMagic) {
			if (effectRage) {
			//prompt for reroll
			dialogContent = "<p>When you are imperiled during your rage, the magic within you can lash out; immediately after you take damage or fail a saving throw while raging, you can use your reaction to roll on the Wild Magic table and immediately produce the effect rolled. This effect replaces your current Wild Magic effect.</p>",       
			rageDialog = await dialogPopUp("Controlled Surge",dialogContent,buttonsControlledSurge)
			rageDialog.render(true);
		}else{
			Rage();
			controlledSurge();
		}


}else{
	Rage();
}

async function Rage() {

    if (effectRage) {
        //end rage if already active
		message = `<i>${actor.name} is no longer raging.</i>`;
        let rageId = effectRage.id;
        await actor.deleteEmbeddedDocuments("ActiveEffect", [rageId]);
		
		//end wild magic rage if present
		if (effectWildMagicRage){
			let wildMagicRageId = effectWildMagicRage.id;
			await actor.deleteEmbeddedDocuments("ActiveEffect", [wildMagicRageId]);
		}
		
		//remove token-aura if present
        if (useTokenAuras) {
            setAura(0, 0, 0); 
        }
		
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

async function rollDice(dice) {
    let diceRoll = new Roll(dice);
    await diceRoll.roll({
        async: true
    });
    return Number(diceRoll.result);
}

function chatMessage(message){
	    ChatMessage.create({
        user: game.user.id,
        speaker: ChatMessage.getSpeaker({
            actor
        }),
        content: message,
        type: CONST.CHAT_MESSAGE_TYPES.EMOTE
    });
	
};

async function createEffects(effect){
	    await actor.createEmbeddedDocuments("ActiveEffect", [effect]);	
};

async function getWildMagic(rollResult) {
    const effectWildMagicRageData = {
            label: effectWildMagicRageLabel,
            icon: "systems/dnd5e/icons/skills/affliction_26.jpg",
            changes: [
            ],
            disabled: false,
            duration: {
                rounds: 10,
                seconds: 60,
                startRound: gameRound,
                startTime: game.time.worldTime
            },
        };
	wildMagicEffects={};
    aura = {
        "distance": 0,
        "colour": "#FFFFFF",
        "opacity": 0
    }; //defaults
    message = '<p>[[' + rollResult + ']]{Wild Magic}</p>'
        switch (rollResult) {
        case 1: //Necro blast
			btnLabel = "Shadowy Tendrils";
            let rollTempHP = await rollDice('1d12');
            let rollNecroticDmg = await rollDice('1d12');
            wildMagicEffects = [{
                    "key": "data.attributes.hp.temp",
                    "value": rollTempHP,
                    "mode": 2,
                    "priority": 20
                }
            ];
            message = message + '<p>Shadowy tendrils lash around out. Each creature of your choice that you can see within 30 feet of you must succeed on a Constitution saving throw or take 1d12 necrotic damage. You also gain 1d12 temporary hit points.</p>';
            message = message + '<div style="text-align:center ; font-size:large">[[' + rollNecroticDmg + ']]{Necrotic}</div> <p></p> <div style="text-align:center ; font-size:large">[[' + rollTempHP + ']]{Temporary HP}</div> <p></p> DC=' + spellDC;
            break;
        case 2: //Teleport
			btnLabel = "Teleport";
            message = '<p> You vanish and reappear on the battlefield!  Until your rage ends, you can use this effect again on each of your turns as a bonus action.</p>';
            aura.distance = 2;
            aura.colour = "#FFDD00"; //yellow
            aura.opacity = 0.25;
            break;
        case 3: //Exploding Navi
			btnLabel = "Exploding Sprite";
            let rollForceDmg = await rollDice('1d6');
            message = message + '<p>An intangible spirit, which looks like a flumph or a pixie (your choice), appears within 5 feet of one creature of your choice that you can see within 30 feet of you. At the end of the current turn, the spirit explodes, and each creature within 5 feet of it must succeed on a Dexterity saving throw or take 1d6 force damage. Until your rage ends, you can use this effect again, summoning another spirit, on each of your turns as a bonus action.</p>';
            message = message + '<div style="text-align:center ; font-size:large">[[' + rollForceDmg + ']]{Force}</div> <p> DC=' + spellDC + '</p>'
            aura.distance = 2;
            aura.colour = "#EFB7E7"; //autumn orange
            aura.opacity = 0.25;
            break;
        case 4: //Lighter weapons
			btnLabel = "Boomerang Weapons";
            message = '<p>Magic infuses one weapon of your choice that you are holding. Until your rage ends, the weapons damage type changes to force, and it gains the light and thrown properties, with a normal range of 20 feet and a long range of 60 feet. If the weapon leaves your hand, the weapon reappears in your hand at the end of the current turn.</p>';
            aura.distance = 2;
            aura.colour = "#F48000"; //autumn orange
            aura.opacity = 0.25;
            break;
        case 5: //Retribution Aura
			btnLabel = "Retribution Aura";
            message = message + '<p>Whenever a creature hits you with an attack roll before your rage ends, that creature takes 1d6 force damage, as magic lashes out in retribution.</p>';
            aura.distance = 2;
            aura.colour = "#C8241B"; //crimson
            aura.opacity = 0.25;
            break;
        case 6: //Protection Aura
			btnLabel = "Protection Aura";
            wildMagicEffects = [{
                    "key": "data.attributes.ac.bonus",
                    "value": 1,
                    "mode": 2,
                    "priority": 20
                }
            ];
            message = message + '<p>Until your rage ends, you are surrounded by multi colored, protective lights. You gain a +1 bonus to AC, and while within 10 feet of you, your allies gain the same bonus.</p>';
            aura.distance = 10;
            aura.colour = "#A9A59F"; //grey
            aura.opacity = 0.25;
            break;
        case 7: //Vine Aura
			btnLabel = "Vines";
            message = message + '<p>Flowers and vines temporarily grow around you. Until your rage ends, the ground within 15 feet of you is difficult terrain for your enemies.</p>';
            aura.distance = 15;
            aura.colour = "#008000"; //green
            aura.opacity = 0.25;
            break;
        case 8: //Ironman
			btnLabel = "Iron Man";
            let rollRadiantDmg = await rollDice('1d6');
            message = message + '<p>A bolt of light shoots from your chest. Another creature of your choice that you can see within 30 feet of you must succeed on a Constitution saving throw or take 1d6 radiant damage and be blinded until the start of your next turn. Until your rage ends, you can use this effect again on each of your turns as a bonus action.</p>';
            message = message + '<div style="text-align:center ; font-size:large">[[' + rollRadiantDmg + ']]{Radiant}</div> <p>DC=' + spellDC + '</p>'
            aura.distance = 2;
            aura.colour = "#00FFFF"; //aqua
            aura.opacity = 0.25;
            break;
        default:
            message = message + 'Wild magic roll not found';
            break;
        }
		effectWildMagicRageData.changes = effectWildMagicRageData.changes.concat(wildMagicEffects);
        return {
        "effectsData": effectWildMagicRageData,
        "message": message,
        "aura": aura,
        "roll": rollResult,
		"btnLabel": btnLabel
    };
};

async function rollWildMagic(roll){
//generates its own roll if not passed a value
	if (effectWildMagicRage){
		let wildMagicRageId = effectWildMagicRage.id;
		await actor.deleteEmbeddedDocuments("ActiveEffect", [wildMagicRageId]);
	}
	
	if (roll===undefined){
			let roll = await rollDice('1d8');
			wildMagicResults = await getWildMagic(Number(roll));
			await createEffects(wildMagicResults.effectsData);
			chatMessage(wildMagicResults.message);
			setAura(wildMagicResults.aura.distance, wildMagicResults.aura.colour, wildMagicResults.aura.opacity);		
	}else{
			wildMagicResults = await getWildMagic(Number(roll));
			await createEffects(wildMagicResults.effectsData);
			chatMessage(wildMagicResults.message);
			setAura(wildMagicResults.aura.distance, wildMagicResults.aura.colour, wildMagicResults.aura.opacity);
	};
	}
	
function setAura(distance, colour, opacity) {
    //apply aura settings
	if (useTokenAuras) {
        if (!moduleTokenAuras) {
            ui.notifications.warn("Token-Auras module not found");
			return;
        }
        if (!moduleTokenAuras.active) {
            ui.notifications.warn("Token-Auras module found, but not active");
			return;
        } 
        
		token.setFlag('token-auras', 'aura1.distance', distance);
		token.setFlag('token-auras', 'aura1.colour', colour);
		token.setFlag('token-auras', 'aura1.opacity', opacity);
        
}
}

 async function controlledSurge(){
	let rollOne = await rollDice('1d8');
	let rollTwo = await rollDice('1d8');
	dialogContent = dialogStyle + "<p>Whenever you roll on the Wild Magic table, you can roll the die twice and choose which of the two effects to unleash. If you roll the same number on both dice, you can ignore the number and choose any effect on the table.</p>";
	if (rollOne == rollTwo){
        controlledSurge = await dialogPopUp("Controlled Surge",dialogContent,buttonsControlledSurge8,"controlled-surge")
        controlledSurge.render(true);
	}else{
		wildMagicResults1 = await getWildMagic(Number(rollOne));
		wildMagicResults2 = await getWildMagic(Number(rollTwo));

		buttonsControlledSurge2 = {
			1: {
				icon: diceIcon,
				label: wildMagicResults1.btnLabel,
				callback: () => rollWildMagic(wildMagicResults1.roll),
			},
			2: {
				icon: diceIcon,
				label: wildMagicResults2.btnLabel,
				callback: () => rollWildMagic(wildMagicResults2.roll),
			}
		}
        controlledSurge = await dialogPopUp("Controlled Surge",dialogContent,buttonsControlledSurge2)
        controlledSurge.render(true);
	}
}; 


async function dialogPopUp(title, content, buttons, id) {
	
    let d = new Dialog({
        title: title,
        content: content,
        buttons: buttons,
    default:
        "endRage",
        render: html => console.log("Register interactivity in the rendered dialog"),
        close: html => console.log("Dialog Closed")
    },
	{
            id: id
	});
    return d;
}


