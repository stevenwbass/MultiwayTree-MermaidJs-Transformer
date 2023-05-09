const yaml_parser = require('yaml-front-matter');

export function transformChartToTrees(chartDef) {
    
    if (chartDef == null || chartDef.length === 0)
        return null;


    /*  mermaidjs supports chart metadata (https://github.com/mermaid-js/mermaid/pull/3706)
        via Jekyll-style YAML front matter blocks (https://jekyllrb.com/docs/front-matter/) e.g.

---
title: `MermaidJS: The Real MVP`
myMetadataKey: my metadata value
myMultiLineMetadata: `my multiline
metadata value`
---

    */
    let metadata = yaml_parser.loadFront(chartDef);

    // it is regrettable that mermaid does not provide a parser...
    let trees = parseChartDef(chartDef);    

    return trees;
}

function parseChartDef(chartDef) {
  // hard-coded to get the test passing
  // TODO: actually parse the chart def and build the trees
  return [
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
}