const { Sample, server } = require('./index');

describe('Sample function', () => {
  afterAll((done) => {
    server.close(done);
  });

  test('should return correct object structure', () => {
    const result = Sample('localhost:4444');
    expect(result).toHaveProperty('name');
    expect(result).toHaveProperty('description');
    expect(result).toHaveProperty('url');
  });

  test('should return "Hello" as name', () => {
    const result = Sample('localhost:4444');
    expect(result.name).toBe('Hello');
  });

  test('should return "World" as description', () => {
    const result = Sample('localhost:4444');
    expect(result.description).toBe('World');
  });

  test('should return host as url', () => {
    const host = 'example.com:4444';
    const result = Sample(host);
    expect(result.url).toBe(host);
  });
});
