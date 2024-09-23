//STA 1e and 2e NPC Ship dice roller with Dice So Nice support
let dialogContent = `
<form>
  <h3>NPC Crew</h3>
  <div class="form-group">
    <label>Number of Dice: <span id="diceValue">2</span></label>
    <input type="range" id="numDice" name="numDice" min="1" max="5" value="2" oninput="document.getElementById('diceValue').textContent = this.value">
  </div>
  <h4>NPC Crew Skill Level</h4>
  <div class="form-group">
    <label><input type="radio" name="skillLevel" value="basic" checked> Basic</label><br>
    <label><input type="radio" name="skillLevel" value="proficient"> Proficient</label><br>
    <label><input type="radio" name="skillLevel" value="talented"> Talented</label><br>
    <label><input type="radio" name="skillLevel" value="exceptional"> Exceptional</label>
  </div>
  <div class="form-group">
    <label>Complication Range: <span id="complicationValue">1</span></label>
    <input type="range" id="complication" name="complication" min="1" max="5" value="1" oninput="document.getElementById('complicationValue').textContent = this.value">
  </div>

  <div class="form-group">
    <table style="border:0px;">
     <tr>
      <td style="width:50%">
       <p style="text-align: right;"><label>Difficulty: <input type="number" id="difficulty" name="difficulty" value="2"></label>
        <br>
       <label>NPC Crew Assist? <input type="checkbox" id="crewAssist" name="crewAssist"></label></p>
      </td>
      <td style="width:50%">
       <p style="text-align: right;"><label>Is the Ship Assisting? <input type="checkbox" id="shipAssist" name="shipAssist" checked></label> 
        <br>
       <label>Private GM Roll? <input type="checkbox" id="privateRoll" name="privateRoll"></label></p>
      </td>
     </tr>
    </table>
  </div>

  <h3>NPC Ship</h3>
  <div class="form-group">
    <label>Number of Dice: <span id="shipDiceValue">1</span></label>
    <input type="range" id="shipNumDice" name="shipNumDice" min="1" max="3" value="1" oninput="document.getElementById('shipDiceValue').textContent = this.value">
  </div>
  
  <div class="form-group">
    <table style="border:0px;">
      <tr>
        <td>
          <p style="text-align: left; font-size:16px; ">Ship Systems</p>
          <div id="shipSystems"></div>
        </td>
        <td>
          <p style="text-align: left; font-size:16px; ">Ship Departments</p>
          <div id="shipDepartments"></div>
        </td>
      </tr>
    </table>
  </div>
</form>
`;

async function rollDice3D(numDice, faces = 20) {
  let roll = new Roll(`${numDice}d${faces}`);
  let result = await roll.evaluate({async: true});
  
  if (game.dice3d) {
    await game.dice3d.showForRoll(roll, game.user, true);
  }
  
  return result.terms[0].results.map(d => d.result);
}

new Dialog({
  title: "NPC Crew and Ship Roll",
  content: dialogContent,
  width: 600,
  buttons: {
    roll: {
      label: "Perform Task",
      callback: async (html) => {
        const token = canvas.tokens.controlled[0];
        const isPrivateRoll = html.find('#privateRoll').is(':checked');
        if (!token) {
          ui.notifications.error("Please select a token for the NPC Ship.");
          return;
        }
        const actor = token.actor;
        const tokenName = token.name || actor.name || "Unknown Ship";

        let selectedSystem = html.find('.selector.system:checked').val();
        let selectedSystemLabel = html.find(`#${selectedSystem}-selector`).siblings('label').text().trim();
        let selectedSystemValue = html.find(`#${selectedSystem}`).text();
        
        let selectedDepartment = html.find('.selector.department:checked').val();
        let selectedDepartmentLabel = html.find(`#${selectedDepartment}-selector`).siblings('label').text().trim();
        let selectedDepartmentValue = html.find(`#${selectedDepartment}`).text();

        let numDice = parseInt(html.find('#numDice').val());
        const skillLevel = html.find('input[name="skillLevel"]:checked').val();
        let attributes, departments;
        switch(skillLevel) {
          case 'basic':
            attributes = 8;
            departments = 1;
            break;
          case 'proficient':
            attributes = 9;
            departments = 2;
            break;
          case 'talented':
            attributes = 10;
            departments = 3;
            break;
          case 'exceptional':
            attributes = 11;
            departments = 4;
            break;
        }
        const difficulty = parseInt(html.find('#difficulty').val());
        const complicationRange = parseInt(html.find('#complication').val());
        
        const shipNumDice = parseInt(html.find('#shipNumDice').val());
        const shipSystems = parseInt(selectedSystemValue);
        const shipDepartments = parseInt(selectedDepartmentValue);
        const shipAttributes = shipSystems + shipDepartments;
        
        let rolls = [];
        let successes = 0;
        let complications = 0;
        
        function processRoll(roll) {
          let rollText = `<span>${roll.toString()}</span>`;
          let success = 0;
          if (roll > 20 - complicationRange) {
            complications++;
            rollText = `<span style="color: red;">${rollText}</span>`;
          } else if (roll <= departments) {
            success = 2;
            rollText = `<strong style="color: yellow;">${rollText}</strong>`;
          } else if (roll <= attributes + departments) {
            success = 1;
            rollText = `<strong style="color: green;">${rollText}</strong>`;
          }
          return { rollText, success };
        }

        function processCrewAssistRoll(roll) {
          let rollText = `<span>${roll.toString()}</span>`;
          let success = 0;
          if (roll > 20 - complicationRange) {
            complications++;
            rollText = `<span style="color: red;">${rollText}</span>`;
          } else if (roll <= departments) {
            success = 2;
            rollText = `<strong style="color: yellow;">${rollText}</strong>`;
          } else if (roll <= attributes + departments) {
            success = 1;
            rollText = `<strong style="color: green;">${rollText}</strong>`;
          }
          return { rollText, success };
        }

        function processShipRoll(roll) {
          let rollShipText = `<span>${roll.toString()}</span>`;
          let success = 0;
          if (roll > 20 - complicationRange) {
            complications++;
            rollShipText = `<span style="color: red;">${rollShipText}</span>`;
          } else if (roll <= shipDepartments) {
            success = 2;
            rollShipText = `<strong style="color: yellow;">${rollShipText}</strong>`;
          } else if (roll <= shipAttributes) {
            success = 1;
            rollShipText = `<strong style="color: green;">${rollShipText}</strong>`;
          }
          return { rollText: rollShipText, success };
        }

        // NPC Crew rolls
        let rollResults = await rollDice3D(numDice);
        for (let i = 0; i < numDice; i++) {
          let { rollText, success } = processRoll(rollResults[i]);
          rolls.push(rollText);
          successes += success;
        }

        //let resultMessage = `<p style="text-align: center; font-size:18px; "><b>${tokenName}</b></p>`;

        let resultMessage = `<table style="border-collapse: separate; border:0px; overflow: hidden;">
                            <tr>
                              <td style="background-color:#163044; padding: 5px; height: 20px; vertical-align: middle;"><span</span></td>
                              <td style="vertical-align: middle; text-align: center; width:50%"><span style="font-size:14px; color: gold;"><b>${tokenName} Crew </b></span></td>
                              <td style="background-color:#163044; padding: px; height: 20px; vertical-align: middle; border-radius: 0px 25px 25px 0px; width:30px;"></td>
                            </tr>
                          </table>`;
        resultMessage += `<table style="border-collapse: separate; border-spacing: 0; border-radius: 0px; border:0px; overflow: hidden; height: 20px;">
                            <tr>
                              <td><p style="text-align: left; font-size:10px">${numDice}d20</p></td>
                              <td><p style="text-align: center; font-size:10px">${skillLevel.charAt(0).toUpperCase() + skillLevel.slice(1)} (Attributes: ${attributes}, Departments: ${departments})</p></td>
                            </tr>
                          </table>`;
        resultMessage += `<div style="text-align: center;">`;
        rolls.forEach(roll => {
          resultMessage += `
            <div style="position: relative; display: inline-block; margin: 5px;">
              <img src="icons/svg/d20-grey.svg" style="width: 30px; height: 30px; opacity: 0.25;">
              <span style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: black; font-weight: bold;">
                ${roll}
              </span>
            </div>
          `;
        });
        resultMessage += `</div>`;
        resultMessage += `<p style="text-align: center; font-size:18px">Successes: ${successes}</p>`;
        resultMessage += `<br>`;
        let crewSuccesses = successes;

        let crewAssist = html.find('#crewAssist').is(':checked');
        let crewAssistRoll = [];
        let crewAssistSuccesses = 0;

        if (crewAssist && crewSuccesses > 0) {
          let crewAssistResult = await rollDice3D(1);
          let { rollText, success } = processCrewAssistRoll(crewAssistResult[0]);
          crewAssistRoll.push(rollText);
          crewAssistSuccesses = success;
          successes += success;

          resultMessage += `<table style="border-collapse: separate; border:0px; overflow: hidden;">
                            <tr>
                              <td style="background-color:#163044; padding: 5px; height: 20px; vertical-align: middle;"><span</span></td>
                              <td style="vertical-align: middle; text-align: center; width:30%"><span style="font-size:14px; color: gold;"><b>Crew Assist</b></span></td>
                              <td style="background-color:#163044; padding: px; height: 20px; vertical-align: middle; border-radius: 0px 25px 25px 0px; width:30px;"></td>
                            </tr>
                          </table>`;
          resultMessage += `<table style="border-collapse: separate; border-spacing: 0; border-radius: 0px; border:0px; overflow: hidden; height: 20px;">
                            <tr>
                              <td><p style="text-align: left; font-size:10px">1d20</p></td>
                              <td><p style="text-align: center; font-size:10px">${skillLevel.charAt(0).toUpperCase() + skillLevel.slice(1)} (Attributes: ${attributes}, Departments: ${departments})</p></td>
                            </tr>
                          </table>`;
          resultMessage += `<div style="text-align: center;">`;
          crewAssistRoll.forEach(roll => {
            resultMessage += `
              <div style="position: relative; display: inline-block; margin: 5px;">
                <img src="icons/svg/d20-grey.svg" style="width: 30px; height: 30px; opacity: 0.25;">
                <span style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: black; font-weight: bold;">
                  ${roll}
                </span>
              </div>
            `;
          });
          resultMessage += `</div><br>`;
          resultMessage += `<p style="text-align: center; font-size:18px">Successes: ${crewAssistSuccesses}</p>`;
        } else if (crewAssist && crewSuccesses === 0) {
          resultMessage += `<p style="text-align: left; font-size:14px; ">Crew Assist</p>`;
          resultMessage += `<strong style="color: red;">NPC Crew did not get a success, so Crew Assist does not roll.</strong><br><br>`;
        } else {
          //resultMessage += `<p style="text-align: left; font-size:14px; ">Crew Assist</p>`;
          //resultMessage += `<strong style="color: red;">Crew Assist is not checked. No additional roll.</strong><br><br>`;
        }

        let shipRolls = [];
        if (html.find('#shipAssist').is(':checked')) {
          if (crewSuccesses > 0) {
            let shipRollResults = await rollDice3D(shipNumDice);
            for (let i = 0; i < shipNumDice; i++) {
              let { rollText, success } = processShipRoll(shipRollResults[i]);
              shipRolls.push(rollText);
              successes += success;
            }
            let shipSuccesses = successes - crewSuccesses - crewAssistSuccesses;

          resultMessage += `<table style="border-collapse: separate; border:0px; overflow: hidden;">
                            <tr>
                              <td style="background-color:#163044; padding: 5px; height: 20px; vertical-align: middle;"><span</span></td>
                              <td style="vertical-align: middle; text-align: center; width:30%"><span style="font-size:14px; color: gold;"><b>Ship Assist</b></span></td>
                              <td style="background-color:#163044; padding: px; height: 20px; vertical-align: middle; border-radius: 0px 25px 25px 0px; width:30px;"></td>
                            </tr>
                          </table>`;
          resultMessage += `<table style="border-collapse: separate; border-spacing: 0; border-radius: 0px; border:0px; overflow: hidden; height: 20px;">
                            <tr>
                              <td><p style="text-align: left; font-size:10px">${shipNumDice}d20</p></td>
                              <td><p style="text-align: center; font-size:10px">System: ${selectedSystemLabel} (${selectedSystemValue}) Department: ${selectedDepartmentLabel} (${selectedDepartmentValue})</p></td>
                            </tr>
                          </table>`;
            resultMessage += `<div style="text-align: center;">`;
            shipRolls.forEach(roll => {
              resultMessage += `
                <div style="position: relative; display: inline-block; margin: 5px;">
                  <img src="icons/svg/d20-grey.svg" style="width: 30px; height: 30px; opacity: 0.25;">
                  <span style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: black; font-weight: bold;">
                    ${roll}
                  </span>
                </div>
              `;
            });
            resultMessage += `</div>`;
            resultMessage += `<p style="text-align: center; font-size:18px">Successes: ${shipSuccesses}</p>`;
          } else {
            resultMessage += `<p style="text-align: left; font-size:14px; ">NPC Ship</p>`;
            resultMessage += `<strong style="color: red;">NPC Crew did not get a success, so NPC Ship does not roll.</strong><br>`;
          }
        } else {
          //resultMessage += `<p style="text-align: left; font-size:14px; ">NPC Ship</p>`;
          //resultMessage += `<strong style="color: red;">Ship Assist is not checked. NPC Ship does not roll.</strong><br>`;
        }
        
        resultMessage += `<br>`;
        resultMessage += `<p style="text-align: left; font-size:18px; "><b>Results</b></p>`;
        resultMessage += `Total Successes: ${successes}<br>`;
        resultMessage += `Difficulty: ${difficulty}<br>`;
        resultMessage += `Complication Range: ${21 - complicationRange}-20<br>`;
        
        if (complications > 0) {
          resultMessage += `<strong style="color: red;">Complication!</strong><br>`;
        }
        
        if (successes >= difficulty) {
          resultMessage += `<strong style="color: green;">Success!</strong>`;
          if (successes > difficulty) {
            let threat = successes - difficulty;
            resultMessage += `<br><strong style="color: orange;">Threat Generated: ${threat}</strong>`;
          }
        } else {
          resultMessage += `<strong style="color: red;">Failure.</strong>`;
        }
        
        ChatMessage.create({
          content: resultMessage,
          whisper: isPrivateRoll ? [game.user.id] : null
        });
      }
    }
  },
  render: (html) => {
    html.find('.dialog-button').css({
      'background-color': 'gold',
      'color': 'black',
      'border-radius': '22px',
      'border': 'none',
      'padding': '7px 14px',
      'font-size': '14px',
      'cursor': 'pointer',
      'transition': 'background-color 0.3s ease'
    });
    html.find('.dialog-button').hover(function () {
      $(this).css('background-color', 'yellow');
    }, function () {
      $(this).css('background-color', 'gold');
    });
    html.find('.form-group').css({'width': '375px',});
    html.find('#difficulty').css({
      'width': '25px',
      'min-width': '15px',
      'max-width': '35px'
    });
    const token = canvas.tokens.controlled[0];
    if (!token) {
      ui.notifications.error("Please select a token for the NPC Ship.");
      return;
    }
    const actor = token.actor;

    // Populate ship systems
    let systemsHtml = '';
    for (let [key, system] of Object.entries(actor.system.systems)) {
      let systemLabel = system.label;
      // Check for specific system label name and change it
      if (systemLabel === "sta.actor.starship.system.communications") {
        systemLabel = "Communications";
      }
      if (systemLabel === "sta.actor.starship.system.computers") {
        systemLabel = "Computers";
      }
      if (systemLabel === "sta.actor.starship.system.engines") {
        systemLabel = "Engines";
      }
      if (systemLabel === "sta.actor.starship.system.sensors") {
        systemLabel = "Sensors";
      }
      if (systemLabel === "sta.actor.starship.system.structure") {
        systemLabel = "Structure";
      }
      if (systemLabel === "sta.actor.starship.system.weapons") {
        systemLabel = "Weapons";
      }
      systemsHtml += `
      <div>
        <input type="radio" id="${key}-selector" name="system" class="selector system" value="${key}">
        <label for="${key}-selector">${systemLabel}: </label>
        <span id="${key}">${system.value}</span>
      </div>
      `;
    }
    html.find('#shipSystems').html(systemsHtml);

    // Populate ship departments
    let departmentsHtml = '';
    for (let [key, department] of Object.entries(actor.system.departments)) {
      let departmentLabel = department.label;
      // Check for specific department label name and change it
      if (departmentLabel === "sta.actor.starship.department.command") {
        departmentLabel = "Command";
      }
      if (departmentLabel === "sta.actor.starship.department.conn") {
        departmentLabel = "Conn";
      }
      if (departmentLabel === "sta.actor.starship.department.engineering") {
        departmentLabel = "Engineering";
      }
      if (departmentLabel === "sta.actor.starship.department.medicine") {
        departmentLabel = "Medicine";
      }
      if (departmentLabel === "sta.actor.starship.department.science") {
        departmentLabel = "Science";
      }
      if (departmentLabel === "sta.actor.starship.department.security") {
        departmentLabel = "Security";
      }
      departmentsHtml += `
      <div>
        <input type="radio" id="${key}-selector" name="department" class="selector department" value="${key}">
        <label for="${key}-selector">${departmentLabel}: </label>
        <span id="${key}">${department.value}</span>
      </div>
      `;
    }
    html.find('#shipDepartments').html(departmentsHtml);
  }
}).render(true);