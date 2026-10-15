#!/usr/bin/env python3
"""Extract DOCX text/tables with OOXML locators and embedded media; Python stdlib."""
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import sys
import xml.etree.ElementTree as ET
import zipfile

W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
NS = {'w': W, 'r': R}

def parse_xml(data):
    # Normalize Strict OOXML namespaces to the equivalent Transitional names.
    data = data.replace(b'http://purl.oclc.org/ooxml/wordprocessingml/main', W.encode())
    data = data.replace(b'http://purl.oclc.org/ooxml/officeDocument/relationships', R.encode())
    return ET.fromstring(data)


def tag(name):
    return '{'+W+'}'+name


def inside(root, value):
    path = Path(value).expanduser()
    path = (root / path).resolve() if not path.is_absolute() else path.resolve()
    if not path.is_relative_to(root):
        raise ValueError('Paths must remain inside the project')
    return path


def inline_text(element, include_deletions=False):
    parts = []
    def visit(node):
        if node.tag == tag('txbxContent'):
            return
        if node.tag in {tag('del'), tag('moveFrom')} and not include_deletions:
            return
        if node.tag in {tag('t'), tag('delText')}:
            parts.append(node.text or '')
        elif node.tag == tag('tab'):
            parts.append('\t')
        elif node.tag in {tag('br'), tag('cr')}:
            parts.append('\\n')
        elif node.tag in {tag('footnoteReference'), tag('endnoteReference'), tag('commentReference')}:
            parts.append('['+node.tag.split('}')[-1]+' id='+node.get(tag('id'), '?')+']')
        for child in node:
            visit(child)
    visit(element)
    return ''.join(parts).strip().replace('\r\n', '\\n').replace('\r', '\\n').replace('\n', '\\n')


def extract(path, output, project, include_deletions=False):
    original_hash = hashlib.sha256(path.read_bytes()).hexdigest()
    lines = [f'SOURCE: {path.relative_to(project).as_posix()}', f'SHA256: {original_hash}',
             'LOCATORS: OOXML part/paragraph/table cell, not Word page numbers.',
             'REVISION POLICY: '+('Include deleted and current text for review.' if include_deletions else 'Current view: exclude deleted/moved-from text; include insertions/moved-to text.')]
    warnings, records, media = [], [], []
    output.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(path) as archive:
        names = archive.namelist()
        if 'word/document.xml' not in names:
            raise ValueError('Not a supported DOCX package: missing word/document.xml')
        styles = {}
        if 'word/styles.xml' in names:
            for style in parse_xml(archive.read('word/styles.xml')).findall('w:style',NS):
                name = style.find('w:name',NS)
                styles[style.get(tag('styleId'),'')] = name.get(tag('val'),'') if name is not None else ''
        parts = ['word/document.xml'] + sorted(n for n in names if re.fullmatch(r'word/(?:header\d+|footer\d+|footnotes|endnotes|comments)\.xml',n))
        for part in parts:
            xml = parse_xml(archive.read(part))
            changes = sum(1 for el in xml.iter() if el.tag in {tag('ins'),tag('del'),tag('moveFrom'),tag('moveTo')})
            if changes:
                warnings.append(f'{part}: {changes} tracked revision containers; inspect both revisions before resolving conflicting requirements.')
            if any(el.tag == tag('altChunk') for el in xml.iter()):
                warnings.append(f'{part}: embedded altChunk content is not extracted; use a Word/LibreOffice visual or dedicated conversion pass.')
            if any('}oMath' in el.tag for el in xml.iter()):
                warnings.append(f'{part}: equations need a visual or equation-aware reading pass.')
            if any(el.tag.endswith('}chart') for el in xml.iter()):
                warnings.append(f'{part}: chart content requires visual review; cached text is not a full chart reading.')
            counters = {'p':0, 'table':0, 'textbox':0}
            def walk(node, context=part):
                if node.tag in {tag('del'),tag('moveFrom')} and not include_deletions:
                    return
                if node.tag == tag('p'):
                    counters['p'] += 1
                    loc = f'{context}/P{counters["p"]:04d}'
                    style_el = node.find('w:pPr/w:pStyle',NS)
                    style_id = style_el.get(tag('val'),'') if style_el is not None else ''
                    value = inline_text(node,include_deletions)
                    image_ids = [el.get('{'+R+'}embed') or el.get('{'+R+'}link') for el in node.iter() if el.get('{'+R+'}embed') or el.get('{'+R+'}link')]
                    metadata = {'locator':loc,'part':part,'text':value,'style_id':style_id,'style_name':styles.get(style_id,style_id),'image_relationship_ids':image_ids}
                    num_pr = node.find('w:pPr/w:numPr',NS)
                    if num_pr is not None:
                        metadata['numbering'] = {el.tag.split('}')[-1]:el.get(tag('val')) for el in num_pr}
                    if value or image_ids:
                        detail = f' style={metadata["style_name"]}' if style_id else ''
                        if image_ids:detail += ' images='+','.join(image_ids)
                        lines.append(f'[{loc}{detail}] {value}')
                        metadata['extract_line'] = len(lines)
                        records.append(metadata)
                    for textbox in node.iter(tag('txbxContent')):
                        counters['textbox'] += 1
                        for child in textbox:
                            walk(child,f'{loc}/TEXTBOX{counters["textbox"]}')
                    return
                if node.tag == tag('tbl'):
                    counters['table'] += 1
                    table_context=f'{context}/T{counters["table"]:03d}'
                    for row_index,row in enumerate(node.findall('w:tr',NS),1):
                        if row.find('w:trPr/w:del',NS) is not None and not include_deletions:
                            continue
                        for cell_index,cell in enumerate(row.findall('w:tc',NS),1):
                            if cell.find('w:tcPr/w:cellDel',NS) is not None and not include_deletions:
                                continue
                            cell_context=f'{table_context}/R{row_index}/C{cell_index}'
                            span=cell.find('w:tcPr/w:gridSpan',NS)
                            merge=cell.find('w:tcPr/w:vMerge',NS)
                            if span is not None or merge is not None:
                                lines.append(f'[{cell_context}] CELL-MERGE gridSpan={span.get(tag("val"),"1") if span is not None else "1"} vMerge={merge.get(tag("val"),"continue") if merge is not None else "none"}')
                            for child in cell:
                                if child.tag != tag('tcPr'):walk(child,cell_context)
                    return
                for child in node:
                    if child.tag in {tag('footnote'),tag('endnote'),tag('comment')}:
                        walk(child,context+'/'+child.tag.split('}')[-1]+'-'+child.get(tag('id'),'?'))
                    else:
                        walk(child,context)
            walk(xml)
        # Relationships map paragraph IDs to media/external targets without following URLs.
        relationships = {}
        for rel_file in sorted(n for n in names if n.startswith('word/_rels/') and n.endswith('.xml.rels')):
            rel_xml = parse_xml(archive.read(rel_file))
            relationships[rel_file] = [{k:el.get(k) for k in ['Id','Type','Target','TargetMode'] if el.get(k) is not None} for el in rel_xml]
        for name in sorted(n for n in names if n.startswith('word/media/') and not n.endswith('/')):
            safe_name = PurePosixPath(name).name
            data = archive.read(name)
            destination = output/'embedded-images'/safe_name
            destination.parent.mkdir(parents=True,exist_ok=True)
            destination.write_bytes(data)
            media.append({'part':name,'path':destination.relative_to(project).as_posix(),'sha256':hashlib.sha256(data).hexdigest()})
        if media:
            warnings.append(f'{len(media)} embedded media files extracted; inspect visual requirements separately. This script performs no OCR.')
        if any(n.startswith(('word/diagrams/','word/embeddings/')) for n in names):
            warnings.append('SmartArt or embedded objects are present and require a separate visual/conversion reading pass.')
    if not records:
        warnings.append('No paragraph text found; document may contain scanned images. Do not claim it was fully read.')
    warnings.append('Automatic list numbering and field instructions are not resolved; cached field text may be stale. No Word page numbers are inferred.')
    text_path = output/'source.txt'
    manifest_path = output/'extraction.json'
    text_path.write_text('\n'.join(lines)+'\n',encoding='utf-8')
    manifest = {'schema_version':1,'source':path.relative_to(project).as_posix(),'source_sha256':original_hash,
                'extract':text_path.relative_to(project).as_posix(),'include_deletions':include_deletions,
                'records':records,'media':media,'relationships':relationships,'warnings':warnings}
    manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    return {'status':'extracted','extract':str(text_path),'metadata':str(manifest_path),'paragraphs':len(records),'media_count':len(media),'warnings':warnings}


def main(argv=None):
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--project',default='.')
    parser.add_argument('--input',required=True,help='Existing .docx inside project')
    parser.add_argument('--output',help='Evidence directory inside project; defaults to docs/design/evidence/<name>-<path hash>')
    parser.add_argument('--include-deletions',action='store_true',help='Include deleted/moved-from text for review')
    args=parser.parse_args(argv)
    root=Path(args.project).resolve()
    try:
        path=inside(root,args.input)
        if not path.is_file() or path.suffix.lower()!='.docx':raise ValueError('Input must be an existing .docx file')
        safe_stem=re.sub(r'[^A-Za-z0-9_-]+','-',path.stem).strip('-') or 'document'
        path_hash=hashlib.sha256(path.relative_to(root).as_posix().encode()).hexdigest()[:8]
        output=inside(root,args.output or f'docs/design/evidence/{safe_stem}-{path_hash}')
        result=extract(path,output,root,args.include_deletions)
    except (ValueError,OSError,ET.ParseError,zipfile.BadZipFile,RuntimeError) as exc:
        print(json.dumps({'status':'failed','reason':str(exc)},ensure_ascii=False),file=sys.stderr)
        return 1
    print(json.dumps(result,ensure_ascii=False))
    return 0


if __name__=='__main__':
    sys.exit(main())
