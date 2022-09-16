const app = require('../../src/app');

describe('\'grid\' service', () => {
  it('registered the service', () => {
    const service = app.service('grid');
    expect(service).toBeTruthy();
  });
});
