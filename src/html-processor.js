import * as cheerio from 'cheerio'

const isLocalResource = (resourceUrl, pageUrl) => {
  const resourceHost = new URL(resourceUrl).hostname
  const pageHost = new URL(pageUrl).hostname
  return resourceHost === pageHost
}

const extractResources = (html, baseUrl) => {
  const $ = cheerio.load(html)
  const resources = []
  const tagsConfig = [
    { selector: 'img[src]', attribute: 'src' },
    { selector: 'script[src]', attribute: 'src' },
    { selector: 'link[href]', attribute: 'href' },
  ]
  for (const config of tagsConfig) {
    $(config.selector).each((index, element) => {
      const attrValue = $(element).attr(config.attribute)
      if (!attrValue || attrValue.trim() === '' || attrValue.startsWith('data:')) {
        return
      }
      const tagName = element.tagName.toLowerCase()
      const absoluteUrl = new URL(attrValue, baseUrl).href
      const attributeName = config.attribute

      if (isLocalResource(absoluteUrl, baseUrl)) {
        resources.push({
          originalSrc: attrValue,
          url: absoluteUrl,
          tagName: tagName,
          attributeName: attributeName,
        })
      }
    })
  }
  return resources
}

/* replaceResourceSources принимает html и карту замен, которая будет формироваться в pageLoader.js */

const replaceResourceSources = (html, replacements) => {
  const $ = cheerio.load(html)
  replacements.forEach((replacement) => {
    let selector = `${replacement.tagName}[${replacement.attributeName}="${replacement.originalSrc}"]`
    let elements = $(selector)
    elements.attr(replacement.attributeName, replacement.newSrc)
  })
  return $.html()
}

export { extractResources, replaceResourceSources }
