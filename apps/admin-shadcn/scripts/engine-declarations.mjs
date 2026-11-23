import { readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const root = path.resolve('.engine-types')
for (const name of await readdir(root, { recursive: true })) {
  if (!name.endsWith('.d.ts')) continue
  const file = path.join(root, name)
  const source = await readFile(file, 'utf8')
  const result = source.replaceAll(/(['"])@\/engine\/([^'"]+)\1/g, (_, quote, specifier) => {
    const relative = path
      .relative(path.dirname(file), path.join(root, 'engine', specifier))
      .replaceAll(path.sep, '/')
    return `${quote}${relative.startsWith('.') ? relative : './' + relative}${quote}`
  })
  if (result !== source) await writeFile(file, result)
}
