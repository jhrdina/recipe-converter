const getEl = (selector: string) => window.document.querySelector(selector);

const recipeFromEl = getEl("#recipeFrom") as HTMLTextAreaElement;
const recipeToEl = getEl("#recipeTo") as HTMLTextAreaElement;

const origPortionsInputEl = getEl("#origPortions") as HTMLInputElement;
const newPortionsInputEl = getEl("#newPortions") as HTMLInputElement;
const multiplierInputEl = getEl("#multiplier") as HTMLInputElement;

const convertButtonEl = getEl("#convertButton") as HTMLButtonElement;

const portionsBox = getEl("#portionsBox") as HTMLDivElement;
const multiplierBox = getEl("#multiplierBox") as HTMLDivElement;

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

      let amount = NaN;
      let rest = line;
      let res: RegExpExecArray = null;

      if ((res = /^(\d+([,.]\d*)?)\s*\/\s*(\d+([,.]\d*)?)/.exec(line))) {
        // Fraction
        const [match, topNum, _, bottomNum] = res;
        amount = parseFloat(topNum) / parseFloat(bottomNum);
        rest = line.substr(match.length);
      } else if ((res = /^\d+([,.]\d*)?/.exec(line))) {
        // Normal number
        const [match] = res;
        amount = parseFloat(match);
        rest = line.substr(match.length);
      } else {
        rest = line;
      }

      if (isNaN(amount)) {
        return line;
      }

      let newAmount = amount * multiplier;

      if (rest.trim().startsWith("g ")) {
        newAmount = Math.round(newAmount);
      } else {
        // Round to two decimal places
        newAmount = Math.round(newAmount * 100) / 100;
      }

      return `${newAmount}${rest}`;
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

const parseNumber = () => {};

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
