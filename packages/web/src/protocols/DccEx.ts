export type DccExCommand = {
  command: string;
  params: string[];
};

export function parseDccExString(input: string) {
  const lines = [...input.matchAll(/<(.*?)>/gm)].map((r) => r[1]);
  const output: DccExCommand[] = [];

  for (const line of lines) {
    if (!line?.trim()) continue;

    const parts = [...line.matchAll(/(?:([^\s"]+)|("(?:[^"]*)"))+[\s]*/gm)];
    const fragments: Array<string> = parts
      .map((r) => r[1] ?? r[2] ?? '')
      .filter((l) => l.length > 0);

    const [command, ...params] = fragments;
    if (!command) continue;
    output.push({
      command,
      params,
    });
  }
  return output;
}
