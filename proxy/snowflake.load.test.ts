/* The semicolon inside "Limescale is fine; cracked plastic is not." is the
 * whole reason this splitter exists. */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { splitStatements } from './snowflake.load'

describe('splitStatements', () => {
  const sql = readFileSync(resolve(process.cwd(), 'data/category-guidance.sql'), 'utf8')
  const stmts = splitStatements(sql)

  it('does not break on a semicolon inside a string literal', () => {
    const insert = stmts.find((s) => s.includes('INSERT INTO CATEGORY_GUIDANCE'))
    expect(insert).toBeDefined()
    expect(insert).toContain('Limescale is fine; cracked plastic is not.')
    expect(insert).toContain('surge-protector')  // the statement survived to its last row
  })

  it('yields exactly the statements the file declares', () => {
    expect(stmts.map(label)).toEqual([
      'CREATE DATABASE',
      'USE DATABASE',
      'USE SCHEMA',
      'CREATE OR REPLACE TABLE',
      'CREATE TABLE',
      'INSERT INTO',
    ])
  })

  it('drops comment-only trailing chunks', () => {
    expect(stmts.every((s) => s.replace(/--[^\n]*/g, '').trim().length > 0)).toBe(true)
  })
})

function label(s: string): string {
  const b = s.replace(/--[^\n]*/g, '').trim()
  return b.split(/\s+/).slice(0, b.startsWith('CREATE OR REPLACE') ? 4 : 2).join(' ')
}
