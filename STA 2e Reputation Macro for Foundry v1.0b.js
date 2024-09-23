// STA 2e & Klingon 1e Reputation Macro for Foundry VTT with Dice So Nice! support
let repDialog = new Dialog({
  title: "Reputation Roll",
  content: `
    <form>
      <div class="form-group">
        <label>Reputation:</label>
        <input type="number" name="reputation" value="3">
      </div>
      <div class="form-group">
        <label>Difficulty:</label>
        <input type="number" name="difficulty" value="0">
      </div>
      <div class="form-group">
        <label>Number of d20s:</label>
        <input type="number" name="diceCount" value="2">
      </div>
      <div class="form-group">
        <label>Reprimands:</label>
        <input type="number" name="reprimands" value="0">
      </div>
    </form>
  `,
  buttons: {
    roll: {
      icon: '<i class="fas fa-dice-d20"></i>',
      label: "Roll",
      callback: (html) => {
        const reputation = parseInt(html.find('[name="reputation"]').val());
        const difficulty = parseInt(html.find('[name="difficulty"]').val());
        const diceCount = parseInt(html.find('[name="diceCount"]').val());
        const reprimands = parseInt(html.find('[name="reprimands"]').val());
        
        performReputationRoll(reputation, difficulty, diceCount, reprimands);
      }
    }
  },
  default: "roll"
});

async function performReputationRoll(reputation, difficulty, diceCount, reprimands) {
  const targetNumber = 7 + reputation;
  const complicationThreshold = 20 - reprimands;
  
  // Create a Roll object for Dice So Nice!
  let roll = new Roll(`${diceCount}d20`);
  
  // Perform the roll
  await roll.evaluate({async: true});
  
  // If Dice So Nice! is active, show the 3D dice animation
  if (game.modules.get("dice-so-nice")?.active) {
    await game.dice3d.showForRoll(roll);
  }

  let rolls = roll.terms[0].results.map(d => d.result);
  let successes = 0;
  let complications = 0;
  
  for (let rollResult of rolls) {
    if (rollResult <= targetNumber) {
      successes += (rollResult <= reputation) ? 2 : 1;
    }
    
    if (rollResult >= complicationThreshold) {
      complications++;
    }
  }
  
  const totalDifficulty = difficulty + complications;
  const difference = successes - totalDifficulty;
  const acclaimed = Math.max(0, difference);
  const reprimandsGained = Math.max(0, -difference);
  
  let resultContent = `
    <h2>Reputation Roll Results</h2>
    <p><strong>Rolls:</strong> ${rolls.join(", ")}</p>
    <p><strong>Successes:</strong> ${successes}</p>
    <p><strong>Complications:</strong> ${complications > 0 ? `<span style="color: red;">${complications}</span>` : complications}</p>
    <p><strong>Total Difficulty:</strong> ${totalDifficulty}</p>
  `;

  if (difference > 0) {
    resultContent += `<p><strong>Acclaimed:</strong> ${acclaimed}</p>`;
  } else if (difference < 0) {
    resultContent += `<p style="color: red;"><strong>Reprimands Gained:</strong> ${reprimandsGained}</p>`;
  } else {
    resultContent += `<p><strong>No Acclaimed Earned</strong></p>`;
  }
  
  // Add dice images with centered, color-coded results and reduced opacity
  resultContent += '<div style="display: flex; flex-wrap: wrap; gap: 5px;">';
  for (let rollResult of rolls) {
    let textColor;
    if (rollResult === 20 || rollResult >= complicationThreshold) {
      textColor = "red";  // Complication or critical failure
    } else if (rollResult <= reputation) {
      textColor = "gold";  // 2 successes
    } else if (rollResult <= targetNumber) {
      textColor = "limegreen";  // 1 success
    } else {
      textColor = "white";  // no success
    }
    
    resultContent += `
      <div style="position: relative; width: 36px; height: 36px;">
        <img src="icons/svg/d20-grey.svg" style="width: 36px; height: 36px; opacity: 0.25;">
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: ${textColor}; font-weight: bold; text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;">
          ${rollResult}
        </div>
      </div>
    `;
  }
  resultContent += '</div>';
  
  ChatMessage.create({
    user: game.user._id,
    speaker: ChatMessage.getSpeaker(),
    content: resultContent,
    roll: roll
  });
}

repDialog.render(true);