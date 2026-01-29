#!/usr/bin/env node
import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { transformUrl, getResourcesDirname, getResourceFilename } from './url-to-filename.js'
import { extractResources, replaceResourceSources } from './html-processor.js'
import downloadResource from './resource-handler.js'
import { log, logNetwork, logFile, logResource, logDebug } from './logger.js'

const { promises: fsp } = fs

const getData = (url) => {
  logNetwork('Начинаю запрос к %s', url)
  return axios.get(url)
    .then(response => {
      if (response.status !== 200) {
        throw new Error(`Ошибка загрузки ${url}: статус ${response.status}`)
      }
      logNetwork('Успешный ответ от %s, статус: %d, размер: %d байт', 
        url, response.status, response.data.length)
      return response.data })
      .catch((error) => {
      if (error.response) {
        throw new Error(`Ошибка загрузки ${url}: статус ${error.response.status}`)
      } else {
        throw new Error(`Не удалось загрузить ${url}: ${error.message}`)
      }
    })
}

const pageLoader = (url, outputDir = process.cwd()) => {
   const startTime = Date.now()
  log('🚀 Начинаю загрузку страницы')
  log('URL: %s', url)
  log('Директория для сохранения: %s', outputDir)
  return getData(url)
    .then((html) => {
      let pageFileName = transformUrl(url)
      let pagePath = path.join(outputDir, pageFileName)
      logFile('Имя файла для HTML: %s', pageFileName)
      logFile('Полный путь: %s', pagePath)
      const resources = extractResources(html, url)
  log('Найдено ресурсов: %d', resources.length)
  logDebug('Ресурсы: %O', resources.map(r => ({
        tag: r.tagName,
        src: r.originalSrc,
        fullUrl: r.url
      })))
      if (resources.length === 0) {
        return fsp.writeFile(pagePath, html, 'utf-8')
          .then(() => pagePath)
          .catch((error) => {
            throw new Error(`Не удалось сохранить файл ${pagePath}: ${error.message}`);
          })
      }

      const resourcesDirname = getResourcesDirname(pageFileName)
      const resourceDir = path.join(outputDir, resourcesDirname)
      logFile('Создаю директорию для ресурсов: %s', resourceDir)

      return fsp.mkdir(resourceDir, { recursive: true })
      .catch((error) => {
          throw new Error(`Не удалось создать директорию ${resourceDir}: ${error.message}`);
        })
        .then(() => {
          logFile('Директория создана: %s', resourceDir)
          const downloadPromises = resources.map((resource) => {
            const resourceFilename = getResourceFilename(resource.url)
            const resourcePath = path.join(resourceDir, resourceFilename)
            resource.localPath = path.join(resourcesDirname, resourceFilename)

            logResource('Скачиваю ресурс: %s', resource.url)
            logResource('Сохраняю как: %s', resourcePath)

            return downloadResource(resource.url, resourcePath)
            .catch((error) => {
                throw new Error(`Не удалось скачать ресурс ${resource.url}: ${error.message}`);
              })
          })
          log('Начинаю скачивание %d ресурсов...', resources.length)
          return Promise.all(downloadPromises)
        })
        .then(() => {
          const replacements = resources.map(resource => ({
            tagName : resource.tagName,
            attributeName : resource.attributeName,
            originalSrc: resource.originalSrc,
            newSrc: resource.localPath
          }))
          log('Заменяю ссылки в HTML...')
          const modifiedHtml = replaceResourceSources(html, replacements)
          return fsp.writeFile(pagePath, modifiedHtml, 'utf-8')
          .catch((error) => {
              throw new Error(`Не удалось сохранить HTML файл ${pagePath}: ${error.message}`);
            })
        })
        .then(() => {
          const totalTime = Date.now() - startTime
          log('✅ Загрузка завершена успешно!')
          log('📊 Итоги:')
          log('   Страница: %s', url)
          log('   Сохранённый HTML: %s', pagePath)
          log('   Ресурсов: %d', resources.length)
          log('   Время выполнения: %dms', totalTime)
          return pagePath
        })
    .catch((error) => {
      throw error
    })
  })
}

export default pageLoader
