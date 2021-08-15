//credit to https://gitlab.com/Freeze020/foundry-vtt-scripts

if (!token)
    return;
const rageResourceName = "Rage"; // change this to what the Barbarian has as resource name on their sheet.
const effectLabel = "Rage";

const useWildMagic = true; //set to true to cast wild magic when raging
const spellDC =  8 + actor.data.data.attributes.prof + actor.data.data.abilities.con.mod;

let hasAvailableResource = false;

const level = actor.data.type === "npc" ? actor.data.data.details.cr : actor.items.find(i => i.name === "Barbarian" && i.type === "class").data.data.levels;
let gameRound = game.combat ? game.combat.round : 0;
let message = "";
const effect = actor.effects.find(e => e.data.label === effectLabel);
if (effect) {
    let rageId = effect.id;
    await actor.deleteEmbeddedDocuments("ActiveEffect", [rageId]);
    message = `<i>${actor.name} is no longer raging.</i>`;
} else {
    const resourceKey = Object.keys(token.actor.data.data.resources).filter(k => token.actor.data.data.resources[k].label === `${rageResourceName}`).shift();
	console.log(resourceKey)
    if (resourceKey && token.actor.data.data.resources[resourceKey].value > 0)
        hasAvailableResource = true;
    if (!hasAvailableResource)
        return ui.notifications.warn("You are out of charges to Rage.");
    //effectData = {};
	const effectData = {
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

	//wildmagic
	if (useWildMagic){
		let wildMagicRoll = await rollDice('1d8');
		wildMagicResults = await castWildMagic(Number(wildMagicRoll));
		//concat array for multiple elements. push doesnt work
		effectData.changes = effectData.changes.concat(wildMagicResults.effects);
		
	}
    await actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
    message = `<em>${actor.name} is RAAAAAAAGING</em>` + wildMagicResults.message;
    let newResources = duplicate(actor.data.data.resources);
    newResources[resourceKey].value--;
    await actor.update({
        "data.resources": newResources
    });

}
ChatMessage.create({
    user: game.user.id,
    speaker: ChatMessage.getSpeaker({
        actor
    }),
    content: message,
    type: CONST.CHAT_MESSAGE_TYPES.EMOTE
});



async function rollDice(dice){
	let diceRoll = new Roll(dice);
	await diceRoll.roll({async:true});
	return Number(diceRoll.result);
}


async function castWildMagic(rollResult) {
	effects = [{}]; //set empty
	message = '<p>[[' +rollResult +']]{Wild Magic}</p>'
    switch (rollResult) {
		case 1: //Necro blast
			let rollTempHP = await rollDice('1d12');
			let rollNecroticDmg = await rollDice('1d12');
			effects =  [{
                "key": "data.attributes.hp.temp",
                "value": rollTempHP,
                "mode": 2,
                "priority": 20
            }];
			
 			message = message + '<p>Shadowy tendrils lash around out. Each creature of your choice that you can see within 30 feet of you must succeed on a Constitution saving throw or take 1d12 necrotic damage. You also gain 1d12 temporary hit points.</p>';
			message = message + '<div style="text-align:center ; font-size:large">[[' +rollNecroticDmg +']]{Necrotic}</div> <p></p> <div style="text-align:center ; font-size:large">[[' + rollTempHP + ']]{Temporary HP}</div> <p></p> DC=';

			break;
		case 2: //Teleport
 			message = '<p> You vanishes and reappear on the battlefield!  Until your rage ends, you can use this effect again on each of your turns as a bonus action.</p>';
			//setAura(distance=2,colour="#00FFFF"); //aqua
			break; 
		case 3: //Exploding Navi
			let rollForceDmg = await rollDice('1d6');
 			message = message + '<p>An intangible spirit, which looks like a flumph or a pixie (your choice), appears within 5 feet of one creature of your choice that you can see within 30 feet of you. At the end of the current turn, the spirit explodes, and each creature within 5 feet of it must succeed on a Dexterity saving throw or take 1d6 force damage. Until your rage ends, you can use this effect again, summoning another spirit, on each of your turns as a bonus action.</p>';
			message = message + '<div style="text-align:center ; font-size:large">[[' + rollForceDmg + ']]{Force}</div> <p> DC=' + spellDC + '</p>'
			break; 
		case 4: //Lighter weapons
 			message = '<p>Magic infuses one weapon of your choice that you are holding. Until your rage ends, the weapons damage type changes to force, and it gains the light and thrown properties, with a normal range of 20 feet and a long range of 60 feet. If the weapon leaves your hand, the weapon reappears in your hand at the end of the current turn.</p>';
			break; 
		case 5: //Retribution Aura
 			message = message + '<p>Whenever a creature hits you with an attack roll before your rage ends, that creature takes 1d6 force damage, as magic lashes out in retribution.</p>';
			//setAura(distance=2,colour="#DC143C"); //crimson
			break; 
		case 6: //Protection Aura
			effects =  [{
                "key": "data.attributes.ac.bonus",
                "value": 1,
                "mode": 2,
                "priority": 20
            }];
 			message = message + '<p>Until your rage ends, you are surrounded by multi colored, protective lights. You gain a +1 bonus to AC, and while within 10 feet of you, your allies gain the same bonus.</p>';
			//setAura(distance=10,colour="#0000FF"); //blue
			break; 
		case 7: //Vine Aura
 			message = message + '<p>Flowers and vines temporarily grow around you. Until your rage ends, the ground within 15 feet of you is difficult terrain for your enemies.</p>';
			//setAura(distance=15,colour="#008000"); //green
			break; 
		case 8: //Ironman
			let rollRadiantDmg = await rollDice('1d6');
 			message = message + '<p>A bolt of light shoots from your chest. Another creature of your choice that you can see within 30 feet of you must succeed on a Constitution saving throw or take 1d6 radiant damage and be blinded until the start of your next turn. Until your rage ends, you can use this effect again on each of your turns as a bonus action.</p>';
			message = message + '<div style="text-align:center ; font-size:large">[['+ rollRadiantDmg +']]{Radiant}</div> <p>DC=' + spellDC + '</p>'
			break; 
		default:
 			message = message + 'Wild magic roll not found';
			break; 
		}

    return {
			"effects" : effects, 
			"message" : message
		};
};
