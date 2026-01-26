#!/usr/bin/env node
import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { transformUrl, getResourcesDirname, getResourceFilename } from './url-to-filename.js'
import { extractImages, replaceImageSources } from './html-processor.js'
import downloadResource from './resource-handler.js'

const { promises: fsp } = fs

const getData = (url) => {
  return axios.get(url)
    .then(response => response.data)
    .catch((error) => {
      throw error
    })
}

const pageLoader = (url, outputDir = process.cwd()) => {
  return getData(url)
    .then((html) => {
      let pageFileName = transformUrl(url)
      let pagePath = path.join(outputDir, pageFileName)

      const images = extractImages(html, url)

      if (images.length === 0) {
        return fsp.writeFile(pagePath, html, 'utf-8')
          .then(() => pagePath)
      }

      const resourcesDirname = getResourcesDirname(pageFileName)
      const resourceDir = path.join(outputDir, resourcesDirname)

      return fsp.mkdir(resourceDir, { recursive: true })
        .then(() => {
          const downloadPromises = images.map((image) => {
            const resourceFilename = getResourceFilename(image.url)
            const resourcePath = path.join(resourceDir, resourceFilename)
            image.localPath = path.join(resourcesDirname, resourceFilename)
            return downloadResource(image.url, resourcePath)
          })
          return Promise.all(downloadPromises)
        })
        .then(() => {
          const replacements = images.map(img => ({
            originalSrc: img.originalSrc,
            newSrc: img.localPath,
          }))
          const modifiedHtml = replaceImageSources(html, replacements)
          return fsp.writeFile(pagePath, modifiedHtml, 'utf-8')
        })
        .then(() => pagePath)
    })
    .catch((error) => {
      throw error
    })
}

export default pageLoader
