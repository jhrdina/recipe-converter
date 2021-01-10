const getEl = (selector: string) => window.document.querySelector(selector);

const recipeFromEl = getEl("#recipeFrom") as HTMLTextAreaElement;
const recipeToEl = getEl("#recipeTo") as HTMLTextAreaElement;

const origPortionsInputEl = getEl("#origPortions") as HTMLInputElement;
const newPortionsInputEl = getEl("#newPortions") as HTMLInputElement;
const multiplierInputEl = getEl("#multiplier") as HTMLInputElement;

const convertButtonEl = getEl("#convertButton") as HTMLButtonElement;

const portionsBox = getEl("#portionsBox") as HTMLDivElement;
const multiplierBox = getEl("#multiplierBox") as HTMLDivElement;

const ROUNDED_UNITS = ["g", "ml"];

// STATE MANAGEMENT

type State = {
  mode: "portions" | "multiplier";
  origPortions: number;
  newPortions: number;
  multiplier: number;
};

let state: State = {
  mode: "portions",
  origPortions: 1,
  newPortions: NaN,
  multiplier: NaN,
};

const isValid = (state: State) => {
  const { mode, origPortions, newPortions, multiplier } = state;

  return (
    (mode === "portions" && origPortions > 0 && newPortions > 0) ||
    (mode === "multiplier" && multiplier > 0)
  );
};

const setState = (newState: State) => {
  state = newState;

  // Computed

  const cIsValid = isValid(state);

  // Update DOM

  portionsBox.classList.toggle("modeBox--selected", state.mode === "portions");
  multiplierBox.classList.toggle(
    "modeBox--selected",
    state.mode === "multiplier"
  );
  convertButtonEl.disabled = !cIsValid;
};

const NUMBER_REGEX = /\d+([,.]\d*)?/;
const FRACTION_REGEX = new RegExp(
  `(${NUMBER_REGEX.source})\\s*\\/\\s*(${NUMBER_REGEX.source})`
);

type ParsedNumber = {
  amount: number;
  rest: string;
};

const parseNumber = (str: string): ParsedNumber => {
  let amount = NaN;
  let rest = str;
  let res: RegExpExecArray = null;

  if ((res = new RegExp(`^${FRACTION_REGEX.source}`).exec(str))) {
    // Fraction
    const [match, topNum, _, bottomNum] = res;
    amount = parseFloat(topNum) / parseFloat(bottomNum);
    rest = str.substr(match.length);
  } else if ((res = new RegExp(`^${NUMBER_REGEX.source}`).exec(str))) {
    // Normal number
    const [match] = res;
    amount = parseFloat(match);
    rest = str.substr(match.length);
  }

  if (isNaN(amount)) {
    return { amount: NaN, rest: str };
  }

  return {
    amount,
    rest,
  };
};

const convert = () => {
  if (!isValid(state)) {
    return;
  }

  const recipeFrom = recipeFromEl.value;
  const multiplier =
    state.mode === "multiplier"
      ? state.multiplier
      : state.newPortions / state.origPortions;

  const recipeTo = recipeFrom
    .split("\n")
    .map((line: string) => {
      line = line.trim();

      // Get amount

      let res = parseNumber(line);

      if (isNaN(res.amount)) {
        return line;
      }

      let rest = res.rest;
      let resTo: ParsedNumber = { amount: NaN, rest };

      // Interval
      if (res.rest.trim().startsWith("-")) {
        // Try to parse interval end
        resTo = parseNumber(res.rest.trim().substr(1).trim());
        rest = resTo.rest;
      }

      let newAmount = res.amount * multiplier;
      let newAmountTo = resTo.amount * multiplier;

      if (ROUNDED_UNITS.some((unit) => rest.trim().startsWith(`${unit} `))) {
        newAmount = Math.round(newAmount);
        newAmountTo = Math.round(newAmountTo);
      } else {
        // Round to two decimal places
        newAmount = Math.round(newAmount * 100) / 100;
        newAmountTo = Math.round(newAmountTo * 100) / 100;
      }

      if (isNaN(newAmountTo)) {
        return `${newAmount}${rest}`;
      } else {
        return `${newAmount} - ${newAmountTo}${rest}`;
      }
    })
    .join("\n");

  recipeToEl.value = recipeTo;
};

origPortionsInputEl.addEventListener("focus", () => {
  setState({
    ...state,
    mode: "portions",
  });
  convert();
});

newPortionsInputEl.addEventListener("focus", () => {
  setState({
    ...state,
    mode: "portions",
  });
  convert();
});

multiplierInputEl.addEventListener("focus", () => {
  setState({
    ...state,
    mode: "multiplier",
  });
  convert();
});

const bindNum = (el: HTMLInputElement, prop: keyof State) => {
  const updateVal = () => {
    const newState = { ...state };
    (newState as any)[prop] = parseFloat(el.value);
    setState(newState);
  };
  el.addEventListener("input", updateVal);
  updateVal();
};

bindNum(origPortionsInputEl, "origPortions");
bindNum(newPortionsInputEl, "newPortions");
bindNum(multiplierInputEl, "multiplier");

[
  convertButtonEl,
  recipeFromEl,
  origPortionsInputEl,
  newPortionsInputEl,
  multiplierInputEl,
].forEach((el) => {
  el.addEventListener("input", convert);
});

document.addEventListener("DOMContentLoaded", () => {
  recipeFromEl.focus();
});
