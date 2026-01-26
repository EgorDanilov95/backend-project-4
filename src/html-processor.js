import * as cheerio from 'cheerio'
const extractImages = (html, baseUrl) => {
  const $ = cheerio.load(html)
  const images = []
  $('img').each((index, element) => {
    const src = $(element).attr('src')
    if (!src || src.startsWith('data:')) {
      return
    }
    const absoluteUrl = new URL(src, baseUrl).href

    images.push({
      originalSrc: src,
      url: absoluteUrl,
    })
  })
  return images
}

/* replaceImageSources принимает html и карту замен, которая будет формироваться в pageLoader.js */

const replaceImageSources = (html, replacements) => {
  const $ = cheerio.load(html)
  replacements.forEach((replacement) => {
    let images = $(`img[src="${replacement.originalSrc}"]`)
    images.attr('src', replacement.newSrc)
  })
  return $.html()
}

export { extractImages, replaceImageSources }
