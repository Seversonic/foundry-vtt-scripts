btnEndRage = {            
                icon: '<i class="fas fa-dice-d20"></i>',
                label: "Venom",
                callback: () => console.log("Reroll Wild Magic")
            }
buttons8 = {

            2: {
                icon: '<i class="fas fa-dice-d20"></i>',
                label: "Venom",
                callback: () => console.log("Reroll Wild Magic"),
            },
            3: {
                icon: '<i class="fas fa-dice-d20"></i>',
                label: "Teleport",
                callback: () => console.log("Reroll Wild Magic"),
            },
            4: {
                icon: '<i class="fas fa-dice-d20"></i>',
                label: "Exploding Navi",
                callback: () => console.log("Reroll Wild Magic"),
            },
            5: {
                icon: '<i class="fas fa-dice-d20"></i>',
                label: "Lighter Weapons",
                callback: () => console.log("Reroll Wild Magic"),
            },
            6: {
                icon: '<i class="fas fa-dice-d20"></i>',
                label: "Retribution Aura",
                callback: () => console.log("Reroll Wild Magic"),
            },
            7: {
                icon: '<i class="fas fa-dice-d20"></i>',
                label: "Protection Aura",
                callback: () => console.log("Reroll Wild Magic"),
            },
            8: {
                icon: '<i class="fas fa-dice-d20"></i>',
                label: "Underbrush",
                callback: () => console.log("Reroll Wild Magic"),
            },
            9: {
                icon: '<i class="fas fa-dice-d20"></i>',
                label: "Iron Man",
                callback: () => console.log("Reroll Wild Magic"),
            }
        }
buttons2 = {

            2: {
                icon: '<i class="fas fa-dice-d20"></i>',
                label: "Venom",
                callback: () => console.log("Reroll Wild Magic"),
            },
            3: {
                icon: '<i class="fas fa-dice-d20"></i>',
                label: "Teleport",
                callback: () => console.log("Reroll Wild Magic"),
            }
        }

buttons8[1]=btnEndRage;
buttons2[1]=btnEndRage;


let dialogContent = `
                  <style>
                      #rage-dialog .dialog-buttons {
                          flex-direction: column;
                      }
                  </style>
                  `;

 
let xx = 0;
xx = await popup(buttons2);

function popup(buttons) {
    let d = new Dialog({
        title: "Rage Choice",
        content: dialogContent + "<p>When you are imperiled during your rage, the magic within you can lash out; immediately after you take damage or fail a saving throw while raging, you can use your reaction to roll on the Wild Magic table and immediately produce the effect rolled. This effect replaces your current Wild Magic effect.</p>",
        buttons: buttons
        ,
    default:
        "endRage",
        render: html => console.log("Register interactivity in the rendered dialog"),
        close: html => console.log("This always is logged no matter which option is chosen")
    },{
            id: "rage-dialog"
});
d.render(true);
}
