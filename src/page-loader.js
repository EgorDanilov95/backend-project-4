#!/usr/bin/env node
import axios from 'axios'
import fs from 'fs'
import path from 'path'
import transformUrl from './url-to-filename.js'
const { promises: fsp } = fs
const getData = (url) => {
  return axios.get(url)
    .then(response => response.data)
    .catch((error) => {
      console.log(error)
      throw error
    })
}

const pageLoader = (url, outputDir = process.cwd()) => {
  return getData(url)
    .then((html) => {
      let fileName = transformUrl(url)
      let fullPath = path.join(outputDir, fileName)
      return fsp.writeFile(fullPath, html, 'utf-8').then(() => fullPath)
    })
    .catch((error) => {
      console.log(error)
      throw error
    })
}
export default pageLoader
