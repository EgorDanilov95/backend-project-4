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

  test('should not create resources dir for page without images', async () => {
    const html = '<html><body>No images</body></html>'

    nock('https://test-noimages.com')
      .get('/')
      .reply(200, html)

    const result = await pageLoader('https://test-noimages.com', tempDir)

    const resourcesDir = path.join(tempDir, 'test-noimages-com_files')
    await expect(fs.access(resourcesDir)).rejects.toThrow()

    const savedHtml = await fs.readFile(result, 'utf-8')
    expect(savedHtml).toBe(html)
  })
})
