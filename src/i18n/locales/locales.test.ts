import { describe, expect, it } from 'vitest'
import en from './en.json'
import de from './de.json'

interface TranslationTree {
  [key: string]: string | TranslationTree
}

function flattenKeys(tree: TranslationTree, prefix = ''): string[] {
  return Object.entries(tree).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key
    return typeof value === 'string' ? [path] : flattenKeys(value, path)
  })
}

describe('translation locales', () => {
  it('provides the same translation keys in English and German', () => {
    expect(flattenKeys(de)).toEqual(flattenKeys(en))
  })
})
