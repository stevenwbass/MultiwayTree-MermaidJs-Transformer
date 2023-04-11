using MultiwayTree;
using System.Text;

namespace MultiwayTreeMermaidJsTransformer
{
    public class TreeToChartDefTransformer<T> where T : IEquatable<T>
    {
        public string Transform(MultiwayTree<T> tree)
        {
            var sb = new StringBuilder();

            // TODO: traverse tree and transform into mermaid chart def

            return sb.ToString();
        }
    }
}