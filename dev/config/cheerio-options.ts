import cheerio from 'cheerio'

export const cheerioOptions: cheerio.CheerioParserOptions = {
  normalizeWhitespace: true,
  xmlMode: false,
  recognizeCDATA: false,
  lowerCaseTags: true
}
