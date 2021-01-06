Hooks.on("chatMessage", function (chatlog, message, chatdata) {
  const pattern = /^\d+k\d+([+]\d+)?$/;
  const roll_pattern = /^(\/r(?:oll)? |\/gmr(?:oll)? |\/b(?:lind)?r(?:oll)? |\/s(?:elf)?r(?:oll)? ){1}/;
  const inside_message_roll = /\[\[(\/r(?:oll)? |\/gmr(?:oll)? |\/b(?:lind)?r(?:oll)? |\/s(?:elf)?r(?:oll)? ){1}\d+k\d+([+]\d+)?\]\]/

  if ( roll_pattern.test(message) ) {
    let parts = message.split(' ')
    // console.log(parts)
    if ( pattern.test(parts[1]) ) {
      let roll_parsed = roll_parser(parts[1])
      chatlog.processMessage(`${parts[0]} ${roll_parsed}`)
      return false
    }
  } else if ( pattern.test(message) ) {
    message = roll_parser(message)

    chatlog.processMessage(`/r ${message}`)
    return false
  } else if ( inside_message_roll.test(message) ) {
    let result = message.replace(/\[\[(\/r .*?)\]\]/g, function(match, token) {
      if ( !inside_message_roll.test(match) ) return match;
      return '[[' + roll_parser(token) + ']]'
    });

    chatlog.processMessage(result)
    return false
  }
});

Hooks.on('renderChatMessage', async (app, html, msg) => {
  if ( app.isRoll ) {
    const pattern = /^\d+d\d+k\d+(x\d+)?( \+\ \d+)?$/;

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
  } else {
    const inside_message_roll = /\d+d\d+k\d+(x\d+)?(\+\d+)?/g
    if( !inside_message_roll.test(msg.message.content) || !msg.message.content.includes('data-formula')) return;

    const roll = msg.message.content.match(inside_message_roll)
    for ( var child of html.find(".message-content")[0].children ) {
      const roll = child.getAttribute('title').match(inside_message_roll).pop()
      let [dices, , kept, explode, bonus] = roll.split(/[dkx+-]+/)
      let xky = `${dices}k${kept}${bonus > 0 ? ' + ' + bonus : ''}`
      child.setAttribute('title', `${xky}`)
      child.innerHTML = child.innerHTML.replace(inside_message_roll, `${xky}`)
    }
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
  const numbers = /^[0-9]+$/;
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
  // console.log(rises + ' ' + bonus)
  bonus += rises * 2;
  return bonus
}
