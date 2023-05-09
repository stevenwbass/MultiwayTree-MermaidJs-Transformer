const transformer = require('../src/mermaidjs-transformer')

test('Empty chart def should return null', () => {
  expect(transformer.transformChartToTrees("")).toBe(null);
});

test('test two', () => {
  let expectedTrees = [
    {
      Data: {
          Attribute: "Entity Type",
          Value: "Firm"
      },
      Children: []
    },
    {
      Data: {
        Attribute: "Entity Type",
        Value: "Product/Strategy"
      },
      Children: [
        {
          Data: {
            Attribute: "Investment Focus",
            Value: "Long Only"
          },
          Children: []
        },
        {
          Data: {
            Attribute: "Investment Focus",
            Value: "Two"
          },
          Children: []
        }
      ]
    }
  ];

  let chartDef = `flowchart LR
  A[Entity Type] --> |Firm| Relevant
  A --> |Product/Strategy| C[Investment Focus]
  C --> |Long Only| Relevant
  C --> |Two| Relevant
  Relevant`;

  expect(transformer.transformChartToTrees(chartDef)).toEqual(expectedTrees);
});