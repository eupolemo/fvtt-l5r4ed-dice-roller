function roll_parser(roll) {
  let [dices, kept_plus_bonus] = roll.split`k`.map(parseIntIfPossible);
  console.log(toString(kept_plus_bonus))
  let [kept, bonus = 0] = kept_plus_bonus.toString().split`+`.map(x=>+x); //Parse to int

  let roll_values = {
    dices,
    kept,
    bonus,
    rises: 0,
    explode: 10
  }
  console.log(roll_values)
  let result = calculate_roll(roll_values)
  return `/r ${result.dices}d10x${roll_values.explode}${10 - result.kept === 0 ? '' : 'dl' + (10 - result.kept)}+${result.bonus}`
}

function parseIntIfPossible(x) {
  var numbers = /^[0-9]+$/;
  if(x.match(numbers)){
    return parseInt(x)
  } else {
    return x
  }
}

function calculate_roll(roll) {
  let result = roll;
  ({dices, rises} = calculate_rises(roll));
  result.dices = dices;
  result.rises = rises;
  ({kept, rises} = calculate_keeps(result));
  result.rises = rises;
  result.kept = kept;
  result.bonus = calculate_bonus(result);
  return result
};

function calculate_rises({dices, rises} = roll) {
  if(dices > 10) {
    rises = dices - 10;
    dices = 10;
  }
  return {dices, rises}
}

function calculate_keeps({kept, rises} = roll) {
  if(kept >=10) {
    rises += kept - 10;
    kept = 10;
  }

  while(kept < 10) {
    if(rises > 0) {
      if(rises > 2)
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

roll = {
  dices: 30,
  kept: 1,
  rises: 0,
  bonus: 0,
}

let roll_string = '10k8'

console.log(roll_parser(roll_string))
