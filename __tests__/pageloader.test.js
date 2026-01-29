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

  test('should download simple page (step 1)', async () => {
    nock('https://test-simple.com')
      .get('/')
      .reply(200, '<html>Test</html>')

    const result = await pageLoader('https://test-simple.com', tempDir)

    expect(result).toBe(path.join(tempDir, 'test-simple-com.html'))

    const content = await fs.readFile(result, 'utf-8')
    expect(content).toBe('<html>Test</html>')
  })

  test('should download page with image correctly', async () => {
    const htmlFixture = await fs.readFile(
      path.join(fixturesPath, 'test-page.html'),
      'utf-8',
    )
    const expectedHtml = await fs.readFile(
      path.join(fixturesPath, 'expected-page.html'),
      'utf-8',
    )
    const imageFixture = await fs.readFile(
      path.join(fixturesPath, 'test-image.png'),
    )

    const testUrl = 'https://test-fixture.com/courses'

    nock('https://test-fixture.com')
      .get('/courses')
      .reply(200, htmlFixture)

    nock('https://test-fixture.com')
      .get('/assets/professions/nodejs.png')
      .reply(200, imageFixture, {
        'Content-Type': 'image/png',
      })

    const result = await pageLoader(testUrl, tempDir)

    expect(result).toBe(path.join(tempDir, 'test-fixture-com-courses.html'))

    const resourcesDir = path.join(tempDir, 'test-fixture-com-courses_files')
    await expect(fs.access(resourcesDir)).resolves.not.toThrow()

    const imagePath = path.join(resourcesDir, 'test-fixture-com-assets-professions-nodejs.png')
    await expect(fs.access(imagePath)).resolves.not.toThrow()

    const savedHtml = await fs.readFile(result, 'utf-8')

    const normalizeHtml = (html) => {
      return html
        .replace(/\s+/g, ' ')
        .replace(/>\s+</g, '><')
        .replace(/\\n/g, '')
        .trim()
    }

    const normalizedSaved = normalizeHtml(savedHtml)

    expect(normalizedSaved).toContain('test-fixture-com-courses_files/test-fixture-com-assets-professions-nodejs.png')
    expect(normalizedSaved).not.toContain('/assets/professions/nodejs.png')
    const adaptedExpected = expectedHtml
      .replace(/ru-hexlet-io/g, 'test-fixture-com')
      .replace(/ru-hexlet-io-courses_files/g, 'test-fixture-com-courses_files')

    const normalizedAdaptedExpected = normalizeHtml(adaptedExpected)

    expect(normalizedSaved).toBe(normalizedAdaptedExpected)
  })

  describe('step 3 - all local resources downloading', () => {
    test('should download all local resources from fixtures', async () => {
      const inputHtml = await fs.readFile(
        path.join(fixturesPath, 'test-page-resources.html'),
        'utf-8',
      )

      const expectedHtml = await fs.readFile(
        path.join(fixturesPath, 'expected-page-resources.html'),
        'utf-8',
      )

      const testUrl = 'https://ru.hexlet.io/courses'

      nock('https://ru.hexlet.io')
        .get('/courses')
        .reply(200, inputHtml)

      nock('https://ru.hexlet.io')
        .get('/assets/professions/nodejs.png')
        .reply(200, Buffer.from('fake image data'))

      nock('https://ru.hexlet.io')
        .get('/assets/application.css')
        .reply(200, 'fake css data')

      nock('https://ru.hexlet.io')
        .get('/packs/js/runtime.js')
        .reply(200, 'fake js data')

      nock('https://ru.hexlet.io')
        .get('/courses')
        .reply(200, 'canonical page content')

      const result = await pageLoader(testUrl, tempDir)

      expect(result).toBe(path.join(tempDir, 'ru-hexlet-io-courses.html'))
      await expect(fs.access(result)).resolves.not.toThrow()

      const resourcesDir = path.join(tempDir, 'ru-hexlet-io-courses_files')
      await expect(fs.access(resourcesDir)).resolves.not.toThrow()

      const files = await fs.readdir(resourcesDir)
      expect(files).toHaveLength(4)

      const expectedFilenames = [
        'ru-hexlet-io-assets-professions-nodejs.png',
        'ru-hexlet-io-assets-application.css',
        'ru-hexlet-io-packs-js-runtime.js',
        'ru-hexlet-io-courses.html',
      ]

      expectedFilenames.forEach((filename) => {
        expect(files).toContain(filename)
      })

      const savedHtml = await fs.readFile(result, 'utf-8')

      const normalizeHtml = (html) => {
        return html
          .replace(/\s+/g, ' ')
          .replace(/>\s+</g, '><')
          .replace(/\\n/g, '')
          .trim()
      }

      const normalizedSaved = normalizeHtml(savedHtml)
      const normalizedExpected = normalizeHtml(expectedHtml)

      expect(normalizedSaved).toBe(normalizedExpected)
    })
  })
})
