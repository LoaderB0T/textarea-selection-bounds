import { describe, expect, test, beforeEach, afterEach } from '@jest/globals';

describe('Test Suite', () => {
  beforeEach(() => {
    console.log('beforeEach');
  });

  afterEach(() => {
    console.log('afterEach');
  });

  test('Test case', done => {
    console.log('test');
    expect(true).toBe(true);
    done();
  });
});
