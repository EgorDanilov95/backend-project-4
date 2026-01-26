const transformUrl = (url) => {
  let result = url.replace(/^[a-z]+:\/\//, '').replace(/[^a-z0-9]/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') + '.html'
  return result
}

const getResourcesDirname = (pageFilename) => {
  return pageFilename.replace('.html', '_files')
}

const getResourceFilename = (resourceUrl) => {
  const urlObj = new URL(resourceUrl)
  const host = urlObj.hostname
  const pathname = urlObj.pathname

  const lastDotIndex = pathname.lastIndexOf('.')

  if (lastDotIndex === -1) {
    const fullPath = host + pathname
    let name = fullPath.replace(/[^a-z0-9]/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    return name.substring(0, 100)
  }

  const pathWithoutExt = pathname.substring(0, lastDotIndex)
  const extension = pathname.substring(lastDotIndex)

  const fullPath = host + pathWithoutExt
  let processedMain = fullPath.replace(/[^a-z0-9]/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
  const maxLength = 150 - extension.length
  if (processedMain.length > maxLength) {
    processedMain = processedMain.substring(0, maxLength)
  }

  return processedMain + extension
}

export { transformUrl, getResourcesDirname, getResourceFilename }
