const transformer = require('../src/multiwaytree-transformer')

test('Null tree should return empty string', () => {
    expect(transformer.transformTreeToChart(null)).toBe("");
  });