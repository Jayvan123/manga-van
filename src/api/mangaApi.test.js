import { describe, expect, it } from 'vitest'
import { listParams } from './mangaApi.js'

describe('MangaDex list parameters', () => {
  it('filters manhwa by Korean original language', () => {
    expect(listParams({ contentType: 'manhwa' })['originalLanguage[]']).toEqual(['ko'])
  })

  it('filters manga by Japanese original language', () => {
    expect(listParams({ contentType: 'manga' })['originalLanguage[]']).toEqual(['ja'])
  })

  it('does not restrict original language when browsing all titles', () => {
    expect(listParams({ contentType: 'all' })['originalLanguage[]']).toBeUndefined()
  })
})
