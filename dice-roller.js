Hooks.on("chatMessage", function (chatlog, message, chatdata) {
  // const pattern = /^\d+k\d+x\d+([+]\d+)?$/;
  const pattern = /^(u|e)?\d+k\d+(x\d+)?([+]\d+)?(\[.+\])?(\#(.*))?$/;
  const roll_pattern = /^(\/r(?:oll)? |\/gmr(?:oll)? |\/b(?:lind)?r(?:oll)? |\/s(?:elf)?r(?:oll)? ){1}/;
  const deferred_inline_roll_pattern = /\[\[(\/r(?:oll)? |\/gmr(?:oll)? |\/b(?:lind)?r(?:oll)? |\/s(?:elf)?r(?:oll)? ){1}(u|e)?\d+k\d+(x\d+)?([+]\d+)?(\[.+\])?\]\]/;
  const immediate_message_roll_pattern = new RegExp(/\[\[(u|e)?\d+k\d+(x\d+)?([+]\d+)?(\[.+\])?(\#(.*))?\]\]/)
  const inside_message_roll_pattern = new RegExp("(" + immediate_message_roll_pattern.source + ")|(" + deferred_inline_roll_pattern.source + ")")
  if (roll_pattern.test(message)) {
    let parts = message.split(" ");
    // console.log(parts)

    if (pattern.test(parts[1])) {
      const describing_dice_pattern = /\[.*\]*$/;
      const describing_dice = parts[1].match(describing_dice_pattern);
      let message_without_describing = parts[1].replace(describing_dice_pattern, "");

      const describing_roll_pattern = /(\#(.*))*$/;
      let describing_roll;
      if(describing_roll_pattern.test(message_without_describing)) {
        describing_roll = message_without_describing.match(describing_roll_pattern);
        message_without_describing = message_without_describing.replace(describing_roll_pattern, "");
      }

      let roll_parsed = roll_parser(message_without_describing);
      chatlog.processMessage(`${parts[0]} ${roll_parsed}${describing_dice ? describing_dice : ""}${describing_roll ? describing_roll[0] : ""}`);
      return false;
    }
  } else if (pattern.test(message)) {
    const describing_dice_pattern = /\[.*\]*$/;
    const describing_dice = message.match(describing_dice_pattern);
    let message_without_describing = message.replace(describing_dice_pattern, "");

    const describing_roll_pattern = /(\#(.*))*$/;
    let describing_roll;
    if(describing_roll_pattern.test(message_without_describing)) {
      describing_roll = message_without_describing.match(describing_roll_pattern);
      message_without_describing = message_without_describing.replace(describing_roll_pattern, "");
    }

    message = roll_parser(message_without_describing);
    chatlog.processMessage(`/r ${message}${describing_dice && describing_dice.length > 0 ? describing_dice[0] : ""}${describing_roll ? describing_roll[0] : ""}`);
    return false;
  } else if (inside_message_roll_pattern.test(message)) {
    const deferred_roll_pattern = /\[\[(?:\/r(?:oll)? |\/gmr(?:oll)? |\/b(?:lind)?r(?:oll)? |\/s(?:elf)?r(?:oll)? ){1}(.*?)\]\]/g;
    const kxy_pattern = /(u|e)?\d+k\d+(x\d+)?([+]\d+)?/;

    let result = message;

    const inline_message_pattern = /\[\[((u|e)?\d+k\d+(x\d+)?([+]\d+)?(\[.+\])?(\#(.*))?){1}\]\]/g

    if( deferred_roll_pattern.test(message))
      result = message.replace(
        deferred_roll_pattern,
        function (match, token) {
          if (!deferred_roll_pattern.test(match)) return match;
          return match.replace(kxy_pattern, roll_parser(token));
        }
      );
    else if ( inline_message_pattern.test(message))
      result = message.replace(
        inline_message_pattern,
        function (match, token) {
          if (!inline_message_pattern.test(match)) return match;
          return match.replace(kxy_pattern, roll_parser(token));
        }
      );
    chatlog.processMessage(result);
    return false;
  }
});

Hooks.on("renderChatMessage", async (app, html, msg) => {
  if (app.isRoll) {
    const pattern = /^\d+d\d+(r1)?k\d+(x(>=)?\d+)?( \+\ \d+)?(\[.+\])?$/;

    const roll = app.roll;
    const formula = roll.formula;
    const die = roll.dice[0];
    let bonus = 0;

    const operator = roll.terms.filter(e => e.operator === "+")
    const operatorIndex = roll.terms.findIndex(e => e.operator === "+")
    if (operator.length > 0) {
      bonus = roll.terms[operatorIndex + 1].number;
    }

    if (pattern.test(formula)) {
      const b_div_tag = '<div class="dice-formula">';
      const e_div_tag = "</div>";
      const b_span_tag = '<span class="part-formula">';
      const e_span_tag = "</span>";
      const b_flavor_tag = '<div class="part-flavor">';
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

      const describing_dice_pattern = /\[.*\]*$/;
      const describing_dice = formula.match(describing_dice_pattern);
      let flavor = "";
      if( describing_dice ) {
        flavor = describing_dice.length > 0 ? describing_dice[0] : "";
      }

      msg.message.content = msg.message.content
        .replace(regex_div, `${b_div_tag} ${roll_l5r}{flavor} ${e_div_tag}`)
        .replace(regex_span, `${b_span_tag} ${roll_l5r} ${e_span_tag}`)
      html.find(".dice-formula")[0].innerHTML = roll_l5r + flavor;
      let part_formula = html.find(".part-formula")[0];
      part_formula.innerHTML = roll_l5r;

      const flavor_pattern = /\[(.*)\]/;
      if(flavor_pattern.test(flavor)) {
         $(`${b_flavor_tag}${flavor.match(flavor_pattern)[1]}${e_span_tag}`).insertAfter(part_formula)
      }

    }
  } else {
    const inside_message_roll = /\d+d\d+(r1)?k\d+(x(>=)?\d+)?(\+\d+)?/g;
    if (
      !inside_message_roll.test(msg.message.content) ||
      !msg.message.content.match(inside_message_roll)
    )
      return;
    const roll = msg.message.content.match(inside_message_roll);
    for (var child of html.find(".message-content")[0].children) {
      if( inside_message_roll.test(child.getAttribute("title")) ) {
        const roll = child.getAttribute("title").match(inside_message_roll).pop();
        let [dice, , kept_explode_bonus] = roll.split(/[dk]+/);
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

        let xky = `${dice}k${kept}${bonus > 0 ? " + " + bonus : ""}${
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
      }
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
  let [dice, kept_explode_bonus] = roll.split`k`.map(parseIntIfPossible);
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
    dice,
    kept,
    bonus,
    rises: 0,
    explode,
    untrained,
    emphasis,
  };

  let result = calculate_roll(roll_values);
  roll_l5r = `${result.dice}k${result.kept}${
    result.bonus > 0
      ? " + " + result.bonus
      : result.bonus < 0
      ? " - " + result.bonus
      : ""
  }${result.untrained ? " Untrained" : " Exploding " + result.explode}`;
  return `${result.dice}d10${emphasis ? "r1" : ""}k${result.kept}${
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
  ({ dice, rises } = calculate_rises(roll));
  calculated_roll.dice = dice;
  calculated_roll.rises = rises;
  ({ kept, rises } = calculate_keeps(calculated_roll));
  calculated_roll.rises = rises;
  calculated_roll.kept = kept;
  calculated_roll.bonus = calculate_bonus(calculated_roll);
  return calculated_roll;
}

function calculate_rises({ dice, rises } = roll) {
  if (dice > 10) {
    rises = dice - 10;
    dice = 10;
  }
  return { dice, rises };
}

function calculate_keeps({ dice, kept, rises } = roll) {
  if (dice < 10) {
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

Hooks.on("quenchReady", (quench) => {
  quench.registerBatch(
    "l5r4d.dice.parser",
    (context) => {
      const { describe, it, assert } = context;

      describe("Roll Parser", function () {
        it("1k1 should be 1d10k1x>=10", function () {
          let roll = roll_parser("1k1");
          assert.ok(roll === "1d10k1x>=10+0");
        })
        it("5k3+1 should be 5d10k3x>=10+1", function () {
          let roll = roll_parser("5k3+1");
          assert.ok(roll === "5d10k3x>=10+1");
        })
        it("11k4 should be 10d10k4x>=10+2", function () {
          let roll = roll_parser("11k4");
          assert.ok(roll === "10d10k4x>=10+2");
        })
        it("12k4 should be 10d10k5x>=10+0", function () {
          let roll = roll_parser("12k4");
          assert.ok(roll === "10d10k5x>=10+0");
        })
        it("13k4+1 should be 10d10k5x>=10+3", function () {
          let roll = roll_parser("13k4+1");
          assert.ok(roll === "10d10k5x>=10+3");
        })
        it("12k10 should be 10d10k10x>=10+4", function () {
          let roll = roll_parser("12k10");
          assert.ok(roll === "10d10k10x>=10+4");
        })
        it("14k9 should be 10d10k10x>=10+4", function () {
          let roll = roll_parser("14k9");
          assert.ok(roll === "10d10k10x>=10+4");
        })
        it("u10k7 should be 10d10k7+0", function () {
          let roll = roll_parser("u10k7");
          assert.ok(roll === "10d10k7+0")
        })
        it("e10k5 should be 10d10r1k5x>=10+0", function () {
          let roll = roll_parser("e10k5");
          assert.ok(roll === "10d10r1k5x>=10+0")
        })
        it("e10k5x8 should be 10d10r1k5x>=8+0", function () {
          let roll = roll_parser("e10k5x8");
          assert.ok(roll === "10d10r1k5x>=8+0")
        })
      })

      describe("Parce Int", function () {
        it("5 should be 5", function () {
          let value = parseIntIfPossible("5");
          assert.ok(value === 5);
        });

        it("1k1 should be 1k1", function () {
          let value = parseIntIfPossible("1k1");
          assert.ok(value === "1k1");
        });
      });

      describe("Calculate Roll", function () {
        it("1 die keeping 1 should be 1 die keeping 1", function () {
          let {dice, kept, bonus, rises, explode, untrained, emphasis} = calculate_roll({
            dice: 1, kept: 1, bonus: 0, rises: 0, explode: 10, untrained: false, emphasis: false});
          assert.ok(dice === 1);
          assert.ok(kept === 1);
          assert.ok(bonus === 0);
          assert.ok(rises === 0);
          assert.ok(explode === 10);
          assert.ok(untrained === false);
          assert.ok(emphasis === false);
        });

        it("untrained 1 die keeping 1 should be 1 die keeping 1 with untrained true", function () {
          let {dice, kept, bonus, rises, explode, untrained, emphasis} = calculate_roll({
            dice: 1, kept: 1, bonus: 0, rises: 0, explode: 10, untrained: true, emphasis: false});
          assert.ok(dice === 1);
          assert.ok(kept === 1);
          assert.ok(bonus === 0);
          assert.ok(rises === 0);
          assert.ok(explode === 10);
          assert.ok(untrained === true);
          assert.ok(emphasis === false);
        });

        it("emphasis 1 die keeping 1 should be 1 die keeping 1 with emphasis true", function () {
          let {dice, kept, bonus, rises, explode, untrained, emphasis} = calculate_roll({
            dice: 1, kept: 1, bonus: 0, rises: 0, explode: 10, untrained: false, emphasis: true});
          assert.ok(dice === 1);
          assert.ok(kept === 1);
          assert.ok(bonus === 0);
          assert.ok(rises === 0);
          assert.ok(explode === 10);
          assert.ok(untrained === false);
          assert.ok(emphasis === true);
        });

        it("13 dice keeping 1 exploding 9 should be 10 dice keeping 2 with 1 rise", function () {
          let {dice, kept, bonus, rises, explode, untrained, emphasis} = calculate_roll({
            dice: 13, kept: 1, bonus: 0, rises: 0, explode: 9, untrained: false, emphasis: false});
          assert.ok(dice === 10);
          assert.ok(kept === 2);
          assert.ok(bonus === 2);
          assert.ok(rises === 1);
          assert.ok(explode === 9);
          assert.ok(untrained === false);
          assert.ok(emphasis === false);
        });
      });

      describe("Calculate Keeps", function () {
        it("10 dice, 1 kept and 0 rise should be 1 kept and 0 rise", function () {
          let {kept,  rises} = calculate_keeps({dice: 10, kept: 1, rises: 0});
          assert.ok(kept === 1);
          assert.ok(rises === 0);
        });

        it("10 dice, 1 kept and 1 rise should be 1 kept and 1 rise", function () {
          let {kept, rises} = calculate_keeps({dice: 10, kept: 1, rises: 1});
          assert.ok(kept === 1);
          assert.ok(rises === 1);
        });

        it("10 dice, 1 kept and 2 rises should be 2 kept and 0 rise", function () {
          let {kept, rises} = calculate_keeps({dice: 10, kept: 1, rises: 2});
          assert.ok(kept === 2);
          assert.ok(rises === 0);
        });

        it("10 dice, 10 kept and 2 rises should be 10 kept and 2 rises", function () {
          let {kept, rises} = calculate_keeps({dice: 10, kept: 10, rises: 2});
          assert.ok(kept === 10);
          assert.ok(rises === 2);
        });

        it("10 dice, 7 kept and 7 rises should be 10 kept and 1 rise", function () {
          let {kept, rises} = calculate_keeps({dice: 10, kept: 7, rises: 7});
          assert.ok(kept === 10);
          assert.ok(rises === 1);
        });
      });

      describe("Calculate Rises", function () {
        it("10 dice and 0 rises sould be 10 dice and 0 rises", function () {
          let {dice, rises} = calculate_rises({dice: 10, rises: 0});
          assert.ok(dice === 10);
          assert.ok(rises === 0);
        });

        it("11 dice and 0 rises should be 10 dice and 1 rise", function () {
          let {dice, rises} = calculate_rises({dice: 11, rises: 0});
          assert.ok(dice === 10);
          assert.ok(rises === 1);
        });

        it("12 dice and 0 rise should be 10 dice and 2 rises", function () {
          let {dice, rises} = calculate_rises({dice: 12, rises: 0});
          assert.ok(dice === 10);
          assert.ok(rises === 2);
        });
      });

      describe("Calculate Bonus", function () {
        it("0 rises and 0 of bonus should be 0 of bonus", function () {
          let bonus = calculate_bonus({rises: 0, bonus: 0});
          assert.ok(bonus === 0);
        });

        it("5 rises and 0 of bonus should be 10 of bonus", function () {
          let bonus = calculate_bonus({rises: 5, bonus: 0});
          assert.ok(bonus === 10);
        });

        it("0 rises and 1 of bonus should be 1 of bonus", function () {
          let bonus = calculate_bonus({rises: 0, bonus: 1});
          assert.ok(bonus === 1);
        });

        it("1 rise and 1 of bonus should be 3 of bonus", function () {
          let bonus = calculate_bonus({rises: 1, bonus: 1});
          assert.ok(bonus === 3);
        });
      });
    },
    { displayName: "L5R4Ed dice Roller: Tests suite" },
  );
});
