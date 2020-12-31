Hooks.on("chatMessage", function (chatlog, message, chatdata) {
  let pattern = /^\d+k\d+([+]\d+)?$/;

  if ( pattern.test(message) ) {
    message = roll_parser(message)
    roll_parsed = message

    chatlog.processMessage(`/r ${message}`)
    return false
  }
});

Hooks.on('renderChatMessage', async (app, html, msg) => {
  if ( !app.isRoll || !app.isContentVisible ) return;
  let pattern = /^\d+d\d+k\d+(x\d+)?( \+\ \d+)?$/;

  const roll = app.roll
  const formula = roll.formula
  const die = roll.dice[0]
  let bonus = 0

  if ( roll.terms.includes('+') ) {
    bonus = roll.terms[roll.terms.indexOf('+') + 1]
  }

  if ( pattern.test(formula) ) {
    const b_div_tag = '<div class="dice-formula">'
    const e_div_tag = "</div>"
    const b_span_tag = '<span class="part-formula">'
    const e_span_tag = '</span>'
    const regex_div = new RegExp(`${b_div_tag}.*?${e_div_tag}`, 'g')
    const regex_span = new RegExp(`${b_span_tag}.*?${e_span_tag}`, 'g')

    let roll_l5r = `${die.number}${die.modifiers[0]}${bonus > 0 ? ' + ' + bonus : ''}${die.modifiers.length > 1 ? ' Exploding: ' + die.modifiers[1].replace('x', '') : ''}`

    msg.message.content = msg.message.content.replace(regex_div, `${b_div_tag} ${roll_l5r} ${e_div_tag}`).replace(regex_span, `${b_span_tag} ${roll_l5r} ${e_span_tag}`);
    html.find(".dice-formula")[0].innerHTML = roll_l5r
    html.find(".part-formula")[0].innerHTML = roll_l5r
  }
})

function roll_parser(roll) {
  let [dices, kept_plus_bonus] = roll.split`k`.map(parseIntIfPossible);
  let [kept, bonus = 0] = kept_plus_bonus.toString().split`+`.map(x=>+x); //Parse to int

  let roll_values = {
    dices,
    kept,
    bonus,
    rises: 0,
    explode: 10
  }
  let result = calculate_roll(roll_values)
  roll_l5r = `${result.dices}k${result.kept}${result.bonus > 0 ? ' + ' + result.bonus : result.bonus < 0 ? ' - ' + result.bonus : ''}${result.explode <= 10 ? ' Exploding ' + result.explode : ''}`
  return `${result.dices}d10k${result.kept}x${result.explode}+${result.bonus}`
}

function parseIntIfPossible(x) {
  var numbers = /^[0-9]+$/;
  if ( x.match(numbers) ) {
    return parseInt(x)
  } else {
    return x
  }
}

function calculate_roll(roll) {
  let calculated_roll = roll;
  ({dices, rises} = calculate_rises(roll));
  calculated_roll.dices = dices;
  calculated_roll.rises = rises;
  ({kept, rises} = calculate_keeps(calculated_roll));
  calculated_roll.rises = rises;
  calculated_roll.kept = kept;
  calculated_roll.bonus = calculate_bonus(calculated_roll);
  return calculated_roll
};

function calculate_rises({dices, rises} = roll) {
  if(dices > 10) {
    rises = dices - 10;
    dices = 10;
  }
  return {dices, rises}
}

function calculate_keeps({kept, rises} = roll) {
  if ( kept >=10 ) {
    rises += kept - 10;
    kept = 10;
  }

  while ( kept < 10 ) {
    if ( rises > 1 ) {
      kept++;
      rises -= 2;
    } else {
      break;
    }
  }

  return {kept, rises}
}

function calculate_bonus({rises, bonus} = roll) {
  console.log(rises + ' ' + bonus)
  bonus += rises * 2;
  return bonus
}
