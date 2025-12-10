export function parseDccExString(input: string) {
  const lines = [...input.matchAll(/<(.*?)>/gm)].map((r) => r[1]);
  const output = [];

  for (const line of lines) {
    if (!line?.trim()) continue;
    const fragments = line.split(' ').filter((l) => l.length > 0);

    const [command, ...params] = fragments;
    output.push({
      command,
      params,
    });
  }
  return output;
}
