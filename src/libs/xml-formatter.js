/**
 * Formata um XML bruto adicionando indentação e quebras de linha.
 * @param {string} xml - O XML bruto.
 * @returns {string} - O XML formatado.
 */
export function formatXml(xml) {
  if (!xml) return '';
  let formatted = '';
  let reg = /(>)(<)(\/*)/g;
  let xmlStr = xml.replace(reg, '$1\r\n$2$3');
  let pad = 0;
  xmlStr.split('\r\n').forEach((node) => {
    let indent = 0;
    if (node.match(/.+<\/\w[^>]*>$/)) {
      indent = 0;
    } else if (node.match(/^<\/\w/)) {
      if (pad !== 0) pad -= 1;
    } else if (node.match(/^<\w[^>]*[^\/]>.*$/)) {
      indent = 1;
    } else {
      indent = 0;
    }

    formatted += '  '.repeat(pad) + node + '\r\n';
    pad += indent;
  });
  return formatted.trim();
}

/**
 * Converte um XML formatado em HTML com realce de sintaxe.
 * @param {string} xml - O XML formatado.
 * @returns {string} - HTML com spans coloridos.
 */
export function highlightXml(xml) {
  if (!xml) return '';

  // Escapar caracteres especiais para HTML
  const escaped = xml
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Realce de sintaxe usando regex
  return escaped.replace(
    /(&lt;(?!!-)\/?)([\w:\-]+)(.*?)(\/?&gt;)/g,
    (match, p1, p2, p3, p4) => {
      // p1: < ou </
      // p2: nome da tag
      // p3: atributos
      // p4: > ou />

      // Colorir atributos
      const attrs = p3.replace(
        /([\w:\-]+)=(&quot;[^&]*&quot;|'[^']*')/g,
        ' <span class="xml-attr">$1</span>=<span class="xml-value">$2</span>'
      );

      return (
        `<span class="xml-delimit">${p1}</span>` +
        `<span class="xml-tag">${p2}</span>` +
        attrs +
        `<span class="xml-delimit">${p4}</span>`
      );
    }
  );
}
