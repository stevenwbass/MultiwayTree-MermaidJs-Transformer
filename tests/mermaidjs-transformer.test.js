const transformer = require('../src/mermaidjs-transformer')

test('Empty chart def should return null', () => {
    expect(transformer.transformChartToTree("")).toBe(null);
  });