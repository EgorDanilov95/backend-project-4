#!/usr/bin/env node
import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { transformUrl, getResourcesDirname, getResourceFilename } from './url-to-filename.js'
import { extractResources, replaceResourceSources } from './html-processor.js'
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

      const resources = extractResources(html, url)

      if (resources.length === 0) {
        return fsp.writeFile(pagePath, html, 'utf-8')
          .then(() => pagePath)
      }

      const resourcesDirname = getResourcesDirname(pageFileName)
      const resourceDir = path.join(outputDir, resourcesDirname)

      return fsp.mkdir(resourceDir, { recursive: true })
        .then(() => {
          const downloadPromises = resources.map((resource) => {
            const resourceFilename = getResourceFilename(resource.url)
            const resourcePath = path.join(resourceDir, resourceFilename)
            resource.localPath = path.join(resourcesDirname, resourceFilename)
            return downloadResource(resource.url, resourcePath)
          })
          return Promise.all(downloadPromises)
        })
        .then(() => {
          const replacements = resources.map(resource => ({
            tagName : resource.tagName,
            attributeName : resource.attributeName,
            originalSrc: resource.originalSrc,
            newSrc: resource.localPath
          }))
          const modifiedHtml = replaceResourceSources(html, replacements)
          return fsp.writeFile(pagePath, modifiedHtml, 'utf-8')
        })
        .then(() => pagePath)
    })
    .catch((error) => {
      throw error
    })
}

export default pageLoader
