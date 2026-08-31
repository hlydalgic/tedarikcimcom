/** Split camelCase or spaced short names for wordmark styling (e.g. AhadaBuldum → Ahada + Buldum). */
export function splitBrandShortName(shortName: string): {
  lead: string;
  tail: string;
} {
  const trimmed = shortName.trim();
  if (!trimmed) return { lead: "", tail: "" };

  const camel = trimmed.match(/^(.+?)([A-Z][A-Za-z0-9]*)$/);
  if (camel) {
    return { lead: camel[1], tail: camel[2] };
  }

  const space = trimmed.indexOf(" ");
  if (space > 0) {
    return {
      lead: trimmed.slice(0, space),
      tail: trimmed.slice(space + 1),
    };
  }

  const mid = Math.ceil(trimmed.length / 2);
  return { lead: trimmed.slice(0, mid), tail: trimmed.slice(mid) };
}
