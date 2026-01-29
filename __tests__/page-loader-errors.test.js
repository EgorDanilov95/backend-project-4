import pageLoader from '../src/page-loader.js';
import nock from 'nock';

describe('Обработка ошибок', () => {
  it('должна выбрасывать ошибку при статусе 404', async () => {
    nock('https://example.com').get('/').reply(404);
    await expect(pageLoader('https://example.com')).rejects.toThrow('Ошибка загрузки')
  });

  it('должна выбрасывать ошибку при проблемах с файловой системой', async () => {
  nock('https://example.com').get('/').reply(200, '<html></html>');
  await expect(pageLoader('https://example.com', '/root'))
    .rejects
    .toThrow('Не удалось сохранить файл');
});
})