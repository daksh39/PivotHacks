/* ---------------------------------------------------------------------------
 * The splitter exists because a semicolon can appear INSIDE a note. Splitting
 * naively on ';' would truncate the INSERT mid-row and silently drop every
 * category after it.
 *
 * The checked-in file happens to carry no such semicolon today — an editing
 * pass removed the one it had. So the hazard is covered by a synthetic fixture
 * rather than by the data: otherwise this could be "simplified" back to
 * sql.split(';'), the suite would stay green, and the bug would return the
 * next time someone writes a note with a semicolon in it.
 * ------------------------------------------------------------------------- */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { __SEED } from './snowflake'
import { splitStatements } from './snowflake.load'

describe('splitStatements — the hazards', () => {
  it('does not break on a semicolon inside a string literal', () => {
    const sql = "INSERT INTO T VALUES ('Limescale is fine; cracked plastic is not.'); SELECT 1"
    const stmts = splitStatements(sql)
    expect(stmts).toHaveLength(2)
    expect(stmts[0]).toContain('cracked plastic is not.')
  })

  it("treats '' as an escaped quote, not the end of the string", () => {
    const sql = "INSERT INTO T VALUES ('a display''s footprint; mostly making'); SELECT 2"
    const stmts = splitStatements(sql)
    expect(stmts).toHaveLength(2)
    expect(stmts[0]).toContain('mostly making')
  })

  it('ignores a semicolon inside a line comment', () => {
    const stmts = splitStatements('-- note; not a boundary\nSELECT 1; SELECT 2')
    expect(stmts).toHaveLength(2)
  })

  it('drops trailing comment-only chunks', () => {
    const stmts = splitStatements('SELECT 1;\n-- just a trailing note\n')
    expect(stmts).toHaveLength(1)
  })
})

describe('splitStatements — the real file', () => {
  const sql = readFileSync(resolve(process.cwd(), 'data/category-guidance.sql'), 'utf8')
  const stmts = splitStatements(sql)

  it('yields exactly the statements the file declares', () => {
    const kinds = stmts.map((s) => s.replace(/--[^\n]*/g, '').trim().split(/\s+/).slice(0, 3).join(' '))
    expect(kinds).toEqual([
      'CREATE DATABASE IF',
      'USE DATABASE VERTE',
      'USE SCHEMA PUBLIC',
      'CREATE OR REPLACE',
      'CREATE TABLE IF',
      'INSERT INTO CATEGORY_GUIDANCE',
    ])
  })

  it('keeps the INSERT whole, down to its last row', () => {
    /* Counted against the seed rather than a literal: the point of this test
     * is that the naive split on ';' does not truncate the statement, and
     * that holds at any table size. */
    const insert = stmts.find((s) => s.includes('INSERT INTO CATEGORY_GUIDANCE'))!
    expect((insert.match(/^\('/gm) ?? []).length).toBe(Object.keys(__SEED).length)
  })
})
