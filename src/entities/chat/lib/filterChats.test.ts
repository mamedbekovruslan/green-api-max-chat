import { describe, expect, it } from 'vitest'
import { contactChat, otherChat } from '@/test/fixtures/chats'
import { filterChats } from './filterChats'

const chats = [contactChat, otherChat]

describe('filterChats', () => {
  it('returns all chats for an empty query', () => {
    expect(filterChats(chats, '  ')).toEqual(chats)
  })

  it('matches the name case-insensitively', () => {
    expect(filterChats(chats, 'ДРУГОЙ')).toEqual([otherChat])
  })

  it('matches phone digits regardless of formatting', () => {
    expect(filterChats(chats, '+7 999 000-00-02')).toEqual([otherChat])
  })

  it('returns nothing when nothing matches', () => {
    expect(filterChats(chats, 'нет такого')).toEqual([])
  })
})
