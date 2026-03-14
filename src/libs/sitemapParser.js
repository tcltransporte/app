import fs from 'fs/promises';
import path from 'path';

/**
 * Parses the web.sitemap XML file into a JSON structure compatible with Sidebar navigation.
 * Uses regex to avoid external dependencies.
 */
export async function parseSitemap() {
  const rootSitemapPath = path.join(process.cwd(), 'web.sitemap');
  const srcSitemapPath = path.join(process.cwd(), 'src', 'web.sitemap');

  try {
    let content;
    try {
      content = await fs.readFile(rootSitemapPath, 'utf8');
    } catch (e) {
      content = await fs.readFile(srcSitemapPath, 'utf8');
    }

    // Remove comments and XML header
    const cleanContent = content
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<\?xml[\s\S]*?\?>/g, '');

    // Function to recursively parse nodes
    const parseNodes = (xmlString) => {
      const nodes = [];
      const nodeRegex = /<siteMapNode\s+([^>]+?)(?:\/>|>([\s\S]*?)<\/siteMapNode>)/gi;
      let match;

      while ((match = nodeRegex.exec(xmlString)) !== null) {
        const attributesString = match[1];
        const childrenContent = match[2];

        const attributes = {};
        const attrRegex = /(\w+)="([^"]*)"/g;
        let attrMatch;
        while ((attrMatch = attrRegex.exec(attributesString)) !== null) {
          attributes[attrMatch[1]] = attrMatch[2];
        }

        // Only include nodes that have a title
        if (attributes.title) {
          const node = {
            text: attributes.title,
            description: attributes.description || '',
            icon: attributes.icon || null,
            path: attributes.url ? attributes.url.replace('~\\', 'https://global.tcltransporte.com.br/').replace(/\\/g, '/') : null,
            roles: attributes.roles ? attributes.roles.split(',').map(r => r.trim()) : []
          };

          if (childrenContent) {
            const subMenu = parseNodes(childrenContent);
            if (subMenu.length > 0) {
              node.subMenu = subMenu;
            }
          }

          nodes.push(node);
        }
      }
      return nodes;
    };

    const rootMatch = /<siteMap>([\s\S]*)<\/siteMap>/i.exec(cleanContent);
    if (!rootMatch) return null;

    const parsed = parseNodes(rootMatch[1]);
    
    // The web.sitemap usually has a top-level node (Início), we want its children if it exists
    if (parsed.length === 1 && parsed[0].text === 'Início') {
        return parsed[0].subMenu || [];
    }

    return parsed;

  } catch (error) {
    if (error.code === 'ENOENT') {
      return null; // Sitemap doesn't exist
    }
    console.error('Error parsing web.sitemap:', error);
    return null;
  }
}
