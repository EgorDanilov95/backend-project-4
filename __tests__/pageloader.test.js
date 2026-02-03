import pageLoader from '../src/page-loader.js'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import nock from 'nock'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const fixturesPath = path.join(__dirname, '..', '__fixtures__')

nock.disableNetConnect()

const normalizeHtml = html => html
  .replace(/\s+/g, ' ')
  .replace(/>\s+</g, '><')
  .replace(/\n/g, '')
  .trim()

const loadFixture = async (name) => {
  const filepath = path.join(fixturesPath, name)
  try {
    return await fs.readFile(filepath, 'utf-8')
  }
  catch {
    return await fs.readFile(filepath)
  }
}

const runPageLoaderTest = async (testCase, tempDir) => {
  const {
    url,
    htmlFixture,
    expectedFixture,
    resources = [],
    expectedFiles = [],
  } = testCase

  const baseUrl = new URL(url).origin
  const domain = new URL(url).hostname
  const dashedDomain = domain.replace(/\./g, '-')

  const htmlContent = await loadFixture(htmlFixture)
  const expectedContent = await loadFixture(expectedFixture)

  nock(baseUrl)
    .get(new URL(url).pathname || '/')
    .reply(200, htmlContent)

  for (const resource of resources) {
    const { path: resourcePath, fixture, content, contentType } = resource

    let responseContent
    if (fixture) {
      responseContent = await loadFixture(fixture)
    }
    else {
      responseContent = content || 'fake content'
    }

    const headers = contentType ? { 'Content-Type': contentType } : {}
    nock(baseUrl).get(resourcePath).reply(200, responseContent, headers)
  }

  const result = await pageLoader(url, tempDir)

  const savedHtml = await fs.readFile(result, 'utf-8')
  const normalizedSaved = normalizeHtml(savedHtml)

  let normalizedExpected = normalizeHtml(expectedContent)

  if (domain !== 'ru.hexlet.io') {
    normalizedExpected = normalizedExpected.replace(/ru-hexlet-io/g, dashedDomain)
  }

  expect(normalizedSaved).toBe(normalizedExpected)

  expect(result).toBe(path.join(tempDir, `${dashedDomain}${new URL(url).pathname.replace(/\/$/, '').replace(/\//g, '-')}.html`))

  if (resources.length > 0) {
    const pageFilename = result.split('/').pop()
    const resourcesDir = path.join(tempDir, pageFilename.replace('.html', '_files'))

    await expect(fs.access(resourcesDir)).resolves.not.toThrow()

    if (expectedFiles.length > 0) {
      const files = await fs.readdir(resourcesDir)
      expect(files).toEqual(expect.arrayContaining(expectedFiles))
      expect(files).toHaveLength(expectedFiles.length)
    }
  }

  return result
}

describe('pageLoader', () => {
  let tempDir

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'))
  })

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true })
    nock.cleanAll()
  })

  afterAll(() => {
    nock.enableNetConnect()
  })

  const testCases = [
    {
      name: 'page with image',
      url: 'https://test-fixture.com/courses',
      htmlFixture: 'test-page.html',
      expectedFixture: 'expected-page.html',
      resources: [
        {
          path: '/assets/professions/nodejs.png',
          fixture: 'test-image.png',
          contentType: 'image/png',
        },
      ],
      expectedFiles: ['test-fixture-com-assets-professions-nodejs.png'],
    },
    {
      name: 'all local resources',
      url: 'https://ru.hexlet.io/courses',
      htmlFixture: 'test-page-resources.html',
      expectedFixture: 'expected-page-resources.html',
      resources: [
        {
          path: '/assets/professions/nodejs.png',
          fixture: 'test-image.png',
          contentType: 'image/png',
        },
        {
          path: '/assets/application.css',
          content: 'fake css data',
          contentType: 'text/css',
        },
        {
          path: '/packs/js/runtime.js',
          content: 'fake js data',
          contentType: 'application/javascript',
        },
        {
          path: '/courses',
          content: 'canonical page content',
          contentType: 'text/html',
        },
      ],
      expectedFiles: [
        'ru-hexlet-io-assets-professions-nodejs.png',
        'ru-hexlet-io-assets-application.css',
        'ru-hexlet-io-packs-js-runtime.js',
        'ru-hexlet-io-courses.html',
      ],
    },
  ]

  test.each(testCases)('should download $name', async (testCase) => {
    await runPageLoaderTest(testCase, tempDir)
  })
})
