const transformer = require('../src/mermaidjs-transformer')

test('Empty chart def should return null', () => {
  expect(transformer.transformChartToTrees("")).toBe(null);
});

test('test two', () => {
  let expectedTrees = [
    {
      Identifier: 'A',
      NextNodeIdentifier : undefined,
      Data: {
          Attribute: "Entity Type",
          Value: "Firm"
      },
      Children: []
    },
    {
      Identifier: 'A',
      NextNodeIdentifier: 'C',
      Data: {
        Attribute: "Entity Type",
        Value: "Product/Strategy"
      },
      Children: [
        {
          Identifier: 'C',
          NextNodeIdentifier : undefined,
          Data: {
            Attribute: "Investment Focus",
            Value: "Long Only"
          },
          Children: []
        },
        {
          Identifier: 'C',
          NextNodeIdentifier : undefined,
          Data: {
            Attribute: "Investment Focus",
            Value: "Two"
          },
          Children: []
        }
      ]
    }
  ];

  let chartDef = `---
title: My awesome chart
---

flowchart LR
  A[Entity Type] --> |Firm| Relevant
  A --> |Product/Strategy| C[Investment Focus]
  C --> |Long Only| Relevant
  C --> |Two| Relevant
  Relevant`;

  debugger;
  let actualTrees = transformer.transformChartToTrees(chartDef);
  expect(actualTrees).toEqual(expectedTrees);
});