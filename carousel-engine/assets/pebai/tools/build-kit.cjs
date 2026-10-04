/* Deterministic export of the approved raster mark. No redraw, tracing or shape synthesis. */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const runtime = process.env.PEBAI_NODE_MODULES || 'C:/Users/Mi Empresa Online/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const sharp = require(path.join(runtime, 'sharp'));
const opentype = require('./opentype.min.cjs');
const root = path.resolve(__dirname, '..');
const source = path.resolve(root, '../logo-kit-v1/pebai-logo-03-master-transparent-v1.png');
const colors = { ink: '#12121A', mineral: '#EFEDE7', signal: '#B7FF3C', violet: '#6A5CFF' };
const fontLight = opentype.loadSync(path.join(root, 'fonts/Manrope-Light.ttf'));
const fontRegular = opentype.loadSync(path.join(root, 'fonts/Manrope-Regular.ttf'));
const out = name => path.join(root, name);
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const num = n => Number(n.toFixed(5));

function wordPaths(text, font, box, spaced = false) {
  const size = 100;
  const glyphs = font.stringToGlyphs(text);
  let tracking = 3;
  if (spaced) {
    const natural = glyphs.map(g => g.getPath(0, 0, size).getBoundingBox());
    const height = Math.max(...natural.map(b => b.y2)) - Math.min(...natural.map(b => b.y1));
    const sx = box.height / height * 1.18;
    const last = glyphs.length - 1;
    const baseWidth = glyphs.slice(0,last).reduce((sum,g)=>sum+g.advanceWidth*size/font.unitsPerEm,0) + natural[last].x2-natural[0].x1;
    tracking = (box.width/sx-baseWidth)/last;
  }
  let x = 0;
  const paths = glyphs.map(g => {
    const p = g.getPath(x, 0, size);
    x += g.advanceWidth * size / font.unitsPerEm + tracking;
    return p;
  });
  const bounds = paths.map(p => p.getBoundingBox());
  const left = Math.min(...bounds.map(b => b.x1));
  const right = Math.max(...bounds.map(b => b.x2));
  const top = Math.min(...bounds.map(b => b.y1));
  const bottom = Math.max(...bounds.map(b => b.y2));
  const sx = box.width / (right - left), sy = box.height / (bottom - top);
  return `<g transform="translate(${box.x} ${box.y}) scale(${num(sx)} ${num(sy)}) translate(${num(-left)} ${num(-top)})">${paths.map(p => `<path d="${p.toPathData(4)}"/>`).join('')}</g>`;
}

function wordmark(color, x, y, width, height) {
  return `<g fill="${color}" aria-label="PEBAI SYSTEMS">${wordPaths('PEBAI', fontLight, {x, y, width, height})}${wordPaths('SYSTEMS', fontRegular, {x: x + width * .004, y: y + height * 1.3, width: width * .992, height: height * .228}, true)}</g>`;
}

function svg(width, height, body, title, description, hybrid = true) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc"><title id="title">${title}</title><desc id="desc">${description}</desc><metadata>PEBAI Systems logo kit v2. ${hybrid ? 'HYBRID SVG: approved PNG mark embedded; this is not a vector mark master. Wordmark, if present, consists of Manrope outlines.' : 'VECTOR WORDMARK ONLY: Manrope outlines. The approved symbol is not contained in this asset.'}</metadata>${body}</svg>\n`;
}

function imageTag(bytes, x, y, width, height) {
  return `<image x="${x}" y="${y}" width="${num(width)}" height="${num(height)}" preserveAspectRatio="xMidYMid meet" xlink:href="data:image/png;base64,${bytes.toString('base64')}"/>`;
}

async function exportSvg(name, content, widths) {
  fs.writeFileSync(out(`${name}.svg`), content);
  for (const width of widths) await sharp(Buffer.from(content)).resize({width}).png({compressionLevel:9}).toFile(out(`${name}-${width}.png`));
}

function makeIco(items) {
  const directory = Buffer.alloc(6 + items.length * 16);
  directory.writeUInt16LE(1, 2);
  directory.writeUInt16LE(items.length, 4);
  let offset = directory.length;
  for (let i = 0; i < items.length; i++) {
    const {size, data} = items[i], pos = 6 + i * 16;
    directory[pos] = size === 256 ? 0 : size;
    directory[pos + 1] = size === 256 ? 0 : size;
    directory.writeUInt16LE(1, pos + 4);
    directory.writeUInt16LE(32, pos + 6);
    directory.writeUInt32LE(data.length, pos + 8);
    directory.writeUInt32LE(offset, pos + 12);
    offset += data.length;
  }
  return Buffer.concat([directory, ...items.map(i => i.data)]);
}

async function main() {
  const original = fs.readFileSync(source);
  fs.writeFileSync(out('pebai-approved-raster-master.png'), original);
  const {data, info} = await sharp(original).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  let x0 = info.width, y0 = info.height, x1 = 0, y1 = 0, nonzero = 0, partial = 0;
  for (let y=0; y<info.height; y++) for (let x=0; x<info.width; x++) {
    const a = data[(y*info.width+x)*4+3];
    if (a) { nonzero++; if (a < 255) partial++; x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y); }
  }
  const crop = {left:x0, top:y0, width:x1-x0+1, height:y1-y0+1};
  const cropped = await sharp(original).extract(crop).raw().toBuffer({resolveWithObject:true});
  const mark = await sharp(cropped.data,{raw:cropped.info}).png({compressionLevel:9}).toBuffer();
  fs.writeFileSync(out('pebai-mark-color.png'), mark);
  const marks = {color:mark};
  for (const [name, hex] of Object.entries({ink:colors.ink, mineral:colors.mineral})) {
    const rgb = hex.match(/[0-9a-f]{2}/gi).map(h => parseInt(h,16));
    const mono = Buffer.from(cropped.data);
    for (let i=0;i<mono.length;i+=4) {mono[i]=rgb[0];mono[i+1]=rgb[1];mono[i+2]=rgb[2];}
    marks[name] = await sharp(mono,{raw:cropped.info}).png({compressionLevel:9}).toBuffer();
    fs.writeFileSync(out(`pebai-mark-${name}.png`),marks[name]);
  }
  for (const [name, bytes] of Object.entries(marks)) {
    await exportSvg(`pebai-mark-${name}`, svg(crop.width,crop.height,imageTag(bytes,0,0,crop.width,crop.height),`PEBAI Systems — ${name} mark`,'Exact approved raster silhouette, with alpha preserved. Fully transparent outer margins have been cropped.'), [256,512]);
  }

  const variants = [
    {name:'color-ink',mark:marks.color,text:colors.ink},
    {name:'color-mineral',mark:marks.color,text:colors.mineral},
    {name:'mono-ink',mark:marks.ink,text:colors.ink},
    {name:'mono-mineral',mark:marks.mineral,text:colors.mineral}
  ];
  for (const variant of variants) {
    const horizontal = imageTag(variant.mark,45,30,300,353.10219) + wordmark(variant.text,402,130,698,112);
    await exportSvg(`pebai-horizontal-${variant.name}`,svg(1160,415,horizontal,`PEBAI Systems — horizontal ${variant.name}`,'Transparent horizontal lockup. Exact approved PNG symbol with Manrope Light extended wordmark and widely spaced Manrope Regular descriptor.'),[580,1160,2320]);
    const stacked = imageTag(variant.mark,240,55,420,494.34307) + wordmark(variant.text,125,615,650,110);
    await exportSvg(`pebai-stacked-${variant.name}`,svg(900,850,stacked,`PEBAI Systems — stacked ${variant.name}`,'Transparent stacked lockup. Exact approved PNG symbol; outlined Manrope typography.'),[450,900,1800]);
  }
  for (const [name,color] of Object.entries({ink:colors.ink,mineral:colors.mineral})) {
    await exportSvg(`pebai-wordmark-${name}`,svg(760,200,wordmark(color,30,15,700,112),`PEBAI Systems — vector wordmark ${name}`,'Wordmark only, no symbol. Manrope Light and Regular outlines; no font dependency.',false),[760,1520]);
  }

  const icon = (size, bg, radius=0) => svg(size,size,`<rect width="${size}" height="${size}" rx="${size*radius}" fill="${bg}"/>` + imageTag(marks.color,size*.153,size*.075,size*.694,size*.85),'PEBAI Systems app icon','Approved raster symbol, optically centered on an ink or mineral background.');
  const transparent = size => svg(size,size,imageTag(marks.color,size*.153,size*.075,size*.694,size*.85),'PEBAI Systems transparent icon','Exact approved raster silhouette in a transparent square.');
  fs.writeFileSync(out('favicon.svg'),icon(512,colors.ink,.21));
  const ico = [];
  for (const size of [16,32,48,64,180,192,256,512]) {
    const data = await sharp(Buffer.from(icon(size,colors.ink,.21))).png({compressionLevel:9}).toBuffer();
    fs.writeFileSync(out(`favicon-${size}.png`),data);
    if ([16,32,48,64,256].includes(size)) ico.push({size,data});
  }
  fs.writeFileSync(out('favicon.ico'),makeIco(ico));
  fs.copyFileSync(out('favicon-180.png'),out('apple-touch-icon.png'));
  for (const size of [512,1024]) {
    for (const [name,bg] of Object.entries({ink:colors.ink,mineral:colors.mineral})) {
      await sharp(Buffer.from(icon(size,bg))).png({compressionLevel:9}).toFile(out(`pebai-avatar-${name}-${size}.png`));
    }
    await sharp(Buffer.from(transparent(size))).png({compressionLevel:9}).toFile(out(`pebai-avatar-transparent-${size}.png`));
  }
  const webmanifest = {name:'PEBAI Systems',short_name:'PEBAI',icons:[{src:'favicon-192.png',sizes:'192x192',type:'image/png'},{src:'favicon-512.png',sizes:'512x512',type:'image/png'}],theme_color:colors.ink,background_color:colors.ink,display:'standalone'};
  fs.writeFileSync(out('site.webmanifest'),JSON.stringify(webmanifest,null,2)+'\n');
  const verification = {
    source:'../logo-kit-v1/pebai-logo-03-master-transparent-v1.png',
    approvedMasterSha256:hash(original), archivedMasterSha256:hash(fs.readFileSync(out('pebai-approved-raster-master.png'))),
    sourceDimensions:{width:info.width,height:info.height}, losslessTransparentCrop:crop,
    alphaNonzeroPixels:nonzero, alphaPartialPixels:partial,
    geometry:'Cropped only alpha-zero outer margins. Every retained source RGBA pixel is unchanged in pebai-mark-color.png. Monochrome RGB replaced; source alpha unchanged.',
    font:{family:'Manrope',mainWeight:300,descriptorWeight:400,main:'Horizontally extended, outlined',descriptor:'Generous custom spacing, outlined'},
    limitations:['The approved symbol is raster, not a true vector master.','SVG lockups embed raster PNG; only typography is vector.','Faint extraction residue and the source edge antialiasing are retained to preserve exact supplied pixels.','PNG exports above native symbol size are enlarged exports and do not add source detail.','At 16–32 px the source tips and narrow center naturally soften; no alternate small-size symbol was invented.'],
    files:fs.readdirSync(root).filter(n=>/\.(png|svg|ico|webmanifest)$/.test(n)).sort()
  };
  fs.writeFileSync(out('asset-manifest.json'),JSON.stringify(verification,null,2)+'\n');
  console.log(JSON.stringify({files:verification.files.length,crop,masterSha256:verification.approvedMasterSha256},null,2));
}
main().catch(e=>{console.error(e);process.exit(1);});
