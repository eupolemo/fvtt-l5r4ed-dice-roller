Hooks.on("chatMessage", function (chatlog, message, chatdata) {
  // const pattern = /^\d+k\d+x\d+([+]\d+)?$/;
  const pattern = /^(u|e)?\d+k\d+(x\d+)?([+]\d+)?$/;
  const roll_pattern = /^(\/r(?:oll)? |\/gmr(?:oll)? |\/b(?:lind)?r(?:oll)? |\/s(?:elf)?r(?:oll)? ){1}/;
  const inside_message_roll = /\[\[(\/r(?:oll)? |\/gmr(?:oll)? |\/b(?:lind)?r(?:oll)? |\/s(?:elf)?r(?:oll)? ){1}(u|e)?\d+k\d+(x\d+)?([+]\d+)?\]\]/;

  if (roll_pattern.test(message)) {
    let parts = message.split(" ");
    // console.log(parts)
    if (pattern.test(parts[1])) {
      let roll_parsed = roll_parser(parts[1]);
      chatlog.processMessage(`${parts[0]} ${roll_parsed}`);
      return false;
    }
  } else if (pattern.test(message)) {
    message = roll_parser(message);

    chatlog.processMessage(`/r ${message}`);
    return false;
  } else if (inside_message_roll.test(message)) {
    const deferred_roll_pattern = /\[\[(?:\/r(?:oll)? |\/gmr(?:oll)? |\/b(?:lind)?r(?:oll)? |\/s(?:elf)?r(?:oll)? ){1}(.*?)\]\]/g;
    const kxy_pattern = /(u|e)?\d+k\d+(x\d+)?([+]\d+)?/;
    let result = message.replace(
      deferred_roll_pattern,
      function (match, token) {
        if (!inside_message_roll.test(match)) return match;
        return match.replace(kxy_pattern, roll_parser(token));
      }
    );

    chatlog.processMessage(result);
    return false;
  }
});

Hooks.on("renderChatMessage", async (app, html, msg) => {
  if (app.isRoll) {
    const pattern = /^\d+d\d+(r1)?k\d+(x(>=)?\d+)?( \+\ \d+)?$/;

    const roll = app.roll;
    const formula = roll.formula;
    const die = roll.dice[0];
    let bonus = 0;

    if (roll.terms.includes("+")) {
      bonus = roll.terms[roll.terms.indexOf("+") + 1];
    }

    if (pattern.test(formula)) {
      const b_div_tag = '<div class="dice-formula">';
      const e_div_tag = "</div>";
      const b_span_tag = '<span class="part-formula">';
      const e_span_tag = "</span>";
      const regex_div = new RegExp(`${b_div_tag}.*?${e_div_tag}`, "g");
      const regex_span = new RegExp(`${b_span_tag}.*?${e_span_tag}`, "g");

      let roll_l5r = `${die.number}${
        die.modifiers[0] === "r1" ? die.modifiers[1] : die.modifiers[0]
      }${bonus > 0 ? " + " + bonus : ""}${
        die.modifiers.length > 1
          ? " Exploding: " +
            (die.modifiers[0] === "r1"
              ? die.modifiers[2].replace("x", "").replace(">=", "") +
                " with Emphasis"
              : die.modifiers[1].replace("x", "").replace(">=", ""))
          : " Untrained"
      }`;

      msg.message.content = msg.message.content
        .replace(regex_div, `${b_div_tag} ${roll_l5r} ${e_div_tag}`)
        .replace(regex_span, `${b_span_tag} ${roll_l5r} ${e_span_tag}`);
      html.find(".dice-formula")[0].innerHTML = roll_l5r;
      html.find(".part-formula")[0].innerHTML = roll_l5r;
    }
  } else {
    const inside_message_roll = /\d+d\d+(r1)?k\d+(x(>=)?\d+)?(\+\d+)?/g;
    if (
      !inside_message_roll.test(msg.message.content) ||
      !msg.message.content.includes("data-formula")
    )
      return;

    const roll = msg.message.content.match(inside_message_roll);
    for (var child of html.find(".message-content")[0].children) {
      const roll = child.getAttribute("title").match(inside_message_roll).pop();
      let [dices, , kept_explode_bonus] = roll.split(/[dk]+/);
      let kept,
        explode_bonus = 0,
        bonus = 0;
      let explode = 11;
      if (kept_explode_bonus.toString().includes("x")) {
        [kept, explode_bonus] = kept_explode_bonus.split(/[x>=]+/);
      } else if (kept_explode_bonus.includes("+")) {
        [kept, bonus] = kept_explode_bonus.split(/[+]+/);
      }
      if (explode_bonus.toString().includes("+")) {
        [explode, bonus = 0] = explode_bonus.split(/[+]+/);
      }

      let xky = `${dices}k${kept}${bonus > 0 ? " + " + bonus : ""}${
        explode <= 10
          ? " Exploding " +
            explode +
            (roll.includes("r1") ? " with Emphasis" : "")
          : " Untrained"
      }`;
      child.setAttribute("title", `${xky}`);
      child.childNodes.forEach((element) => {
        let a = 0;
        if (element.nodeValue === null) {
          return;
        }
        element.nodeValue = element.nodeValue.replace(
          inside_message_roll,
          `${xky}`
        );
      });
      // child.innerHTML = child.innerHTML
      //   .text()
      //   .replace(inside_message_roll, `${xky}`);
    }
  }
});

function roll_parser(roll) {
  let untrained = false;
  let emphasis = false;
  if (roll.includes("u")) {
    roll = roll.replace("u", "");
    untrained = true;
  } else if (roll.includes("e")) {
    roll = roll.replace("e", "");
    emphasis = true;
  }
  let [dices, kept_explode_bonus] = roll.split`k`.map(parseIntIfPossible);
  let kept,
    explode_bonus,
    explode = 10,
    bonus = 0;
  if (kept_explode_bonus.toString().includes("x")) {
    [kept, explode_bonus = 10] = kept_explode_bonus.toString().split("x");
    [explode, bonus = 0] = explode_bonus.toString().split`+`.map((x) => +x); //Parse to int
  } else {
    [kept, bonus = 0] = kept_explode_bonus.toString().split`+`.map((x) => +x);
  }

  let roll_values = {
    dices,
    kept,
    bonus,
    rises: 0,
    explode,
    untrained,
    emphasis,
  };

  let result = calculate_roll(roll_values);
  roll_l5r = `${result.dices}k${result.kept}${
    result.bonus > 0
      ? " + " + result.bonus
      : result.bonus < 0
      ? " - " + result.bonus
      : ""
  }${result.untrained ? " Untrained" : " Exploding " + result.explode}`;
  return `${result.dices}d10${emphasis ? "r1" : ""}k${result.kept}${
    result.untrained ? "" : "x>=" + result.explode
  }+${result.bonus}`;
}

function parseIntIfPossible(x) {
  const numbers = /^[0-9]+$/;
  if (x.match(numbers)) {
    return parseInt(x);
  } else {
    return x;
  }
}

function calculate_roll(roll) {
  let calculated_roll = roll;
  ({ dices, rises } = calculate_rises(roll));
  calculated_roll.dices = dices;
  calculated_roll.rises = rises;
  ({ kept, rises } = calculate_keeps(calculated_roll));
  calculated_roll.rises = rises;
  calculated_roll.kept = kept;
  calculated_roll.bonus = calculate_bonus(calculated_roll);
  return calculated_roll;
}

function calculate_rises({ dices, rises } = roll) {
  if (dices > 10) {
    rises = dices - 10;
    dices = 10;
  }
  return { dices, rises };
}

function calculate_keeps({ dices, kept, rises } = roll) {
  if (dices < 10) {
    if (kept > 10) {
      kept = 10;
    }
  } else if (kept >= 10) {
    rises += kept - 10;
    kept = 10;
  }

  while (kept < 10) {
    if (rises > 1) {
      kept++;
      rises -= 2;
    } else {
      break;
    }
  }

  return { kept, rises };
}

function calculate_bonus({ rises, bonus } = roll) {
  // console.log(rises + ' ' + bonus)
  bonus += rises * 2;
  return bonus;
}
