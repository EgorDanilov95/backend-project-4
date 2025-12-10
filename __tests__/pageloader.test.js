import pageLoader from '../src/page-loader.js'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import nock from 'nock'

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

  describe('successful download', () => {
    beforeEach(() => {
      nock('https://ru.hexlet.io')
        .get('/courses')
        .reply(200, '<html>Курсы</html>')
    })

    test('should download and save page', async () => {
      const result = await pageLoader('https://ru.hexlet.io/courses', tempDir)

      expect(result).toBe(path.join(tempDir, 'ru-hexlet-io-courses.html'))

      await expect(fs.access(result)).resolves.not.toThrow()

      const content = await fs.readFile(result, 'utf-8')
      expect(content).toBe('<html>Курсы</html>')
    })

    test('should use process.cwd() as default output', async () => {
      nock('https://example.com')
        .get('/')
        .reply(200, '<html>Test</html>')

      const result = await pageLoader('https://example.com')
      const expectedPath = path.join(process.cwd(), 'example-com.html')

      expect(result).toBe(expectedPath)

      await fs.rm(expectedPath, { force: true })
    })
  })

  describe('error handling', () => {
    test('should handle HTTP 404 error', async () => {
      nock('https://example.com')
        .get('/')
        .reply(404, 'Not Found')

      await expect(pageLoader('https://example.com', tempDir))
        .rejects.toThrow()
    })

    test('should handle network error', async () => {
      nock('https://example.com')
        .get('/')
        .replyWithError('Network error')

      await expect(pageLoader('https://example.com', tempDir))
        .rejects.toThrow('Network error')
    })

    test('should handle file system error', async () => {
      nock('https://example.com')
        .get('/')
        .reply(200, '<html>Test</html>')

      const invalidPath = path.join(tempDir, 'non-existent', 'subdir')

      await expect(pageLoader('https://example.com', invalidPath))
        .rejects.toThrow()
    })
  })

  describe('different URL formats', () => {
    test('should handle URL with query parameters', async () => {
      nock('https://example.com')
        .get('/page')
        .query({ id: '1', name: 'test' })
        .reply(200, '<html>Page</html>')

      const result = await pageLoader('https://example.com/page?id=1&name=test', tempDir)
      expect(path.basename(result)).toBe('example-com-page-id-1-name-test.html')
    })

    test('should handle URL with trailing slash', async () => {
      nock('https://example.com')
        .get('/')
        .reply(200, '<html>Home</html>')

      const result = await pageLoader('https://example.com/', tempDir)
      expect(path.basename(result)).toBe('example-com.html')
    })
  })
})
