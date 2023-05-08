const transformer = require('../src/multiwaytree-transformer')

test('Null tree should return empty string', () => {
    expect(transformer.transformTreesToChart(null)).toBe("");
  });