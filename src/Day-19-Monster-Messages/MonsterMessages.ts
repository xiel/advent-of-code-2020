export function parseRulesAndMessages(groups: string[]) {
  const messages = groups[1].split("\n").filter(Boolean);
  const rules = groups[0].split("\n").filter(Boolean);
  const ruleMap: RuleMap = new Map();

  rules.forEach((ruleStr) => {
    const [ruleIndexStr, ruleValue] = ruleStr.split(": ");
    const ruleIndex = Number(ruleIndexStr);
    const subRuleOptions = ruleValue
      .split(" | ")
      .map((o) => o.split(" ").map((n) => parseInt(n)));

    const charValue = ruleValue.includes('"')
      ? unquote(ruleValue.trim())
      : undefined;

    if (charValue) {
      ruleMap.set(ruleIndex, matchCharRule);
    } else {
      ruleMap.set(ruleIndex, matchRule);
    }

    function matchRule(str: string): string | null {
      const matches = subRuleOptions
        .flatMap((ruleIndexSequence) => {
          let matchedStr = "";

          try {
            ruleIndexSequence.reduce((currentRest, ruleI) => {
              const matchedPartStr = getRule(ruleI)(currentRest);

              if (!matchedPartStr) throw Error("no match found");

              matchedStr += matchedPartStr;
              return removeMatchedPart(currentRest, matchedPartStr);
            }, str);
          } catch (e) {
            return [];
          }

          return matchedStr ? matchedStr : [];
        })
        // make this algo greedy, the longest match is the one we want :)
        .sort((sA, sB) => sB.length - sA.length);

      return matches.length ? matches[0] : null;
    }

    function matchCharRule(str: string): string | null {
      if (!charValue) throw Error("charValue missing");
      return str.startsWith(charValue) ? charValue : null;
    }
  });

  return {
    ruleMap,
    messages,
  };

  function getRule(i: number) {
    return ruleMap.get(i)!;
  }

  function removeMatchedPart(str: string, usedStr: string) {
    return str.replace(usedStr, "");
  }
}

type RuleMap = Map<number, MatchRule>;
type MatchRule = (str: string) => string | null;

// How many messages completely match rule 0
export function countMessagesMatchingRule({
  messages,
  ruleMap,
}: {
  messages: string[];
  ruleMap: RuleMap;
  rule?: number;
}) {
  const matchRuleZerro = ruleMap.get(0)!;
  const validMessages = messages.filter((m) => matchRuleZerro(m) === m);
  return validMessages.length;
}

function unquote(str: string) {
  return str.replace(/^"/, "").replace(/"$/, "");
}
