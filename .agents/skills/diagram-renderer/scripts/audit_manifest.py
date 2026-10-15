#!/usr/bin/env python3
"""Check diagram evidence metadata; does not check semantic truth or UML syntax."""
import argparse
import json
from pathlib import Path
import sys


def project_path(root, value):
    if not isinstance(value, str) or not value or Path(value).is_absolute():
        raise ValueError('Expected nonempty project-relative path')
    path = (root / value).resolve()
    if not path.is_relative_to(root):
        raise ValueError('Path escapes project')
    return path


def audit(root, data):
    errors, warnings = [], []
    if not isinstance(data, dict) or data.get('schema_version') != 1:
        return ['Expected object with schema_version=1'], []
    requirements = data.get('requirements')
    diagrams = data.get('diagrams')
    if not isinstance(requirements, list) or not isinstance(diagrams, list) or not diagrams:
        return ['requirements must be a list and diagrams must be a nonempty list'], []
    cache = {}
    def sources(item, where, mandatory=True, diagram_path=None):
        refs = item.get('sources', [])
        if not isinstance(refs, list) or (mandatory and not refs):
            errors.append(f'{where}: missing source citations');return
        for ref in refs:
            if not isinstance(ref, dict):
                errors.append(f'{where}: source must be an object');continue
            try:
                path = project_path(root, ref.get('path'))
                if path == diagram_path:
                    raise ValueError('Diagram cannot be its own evidence')
                if not path.is_file():
                    raise ValueError('Evidence file does not exist')
                if path not in cache:
                    cache[path] = len(path.read_text(encoding='utf-8-sig').splitlines())
                start, end = ref.get('start_line'), ref.get('end_line')
                if type(start) is not int or type(end) is not int or not 1 <= start <= end <= cache[path]:
                    raise ValueError(f'Invalid line range for {ref.get("path")}')
            except (ValueError, OSError, UnicodeError) as exc:
                errors.append(f'{where}: {exc}')
    req_ids = set()
    for req in requirements:
        if not isinstance(req, dict):
            errors.append('Requirement must be object');continue
        ident = req.get('id')
        if not isinstance(ident, str) or not ident or ident in req_ids:
            errors.append(f'Duplicate/missing requirement ID: {ident}')
        else:
            req_ids.add(ident)
        if not isinstance(req.get('label'), str) or not req.get('label'):
            errors.append(f'{ident}: missing label')
        sources(req, f'Requirement {ident}')
    diagram_ids, diagram_paths, linked = set(), set(), set()
    stable = {}
    for diagram in diagrams:
        if not isinstance(diagram, dict):
            errors.append('Diagram must be object');continue
        ident = diagram.get('id')
        if not isinstance(ident, str) or not ident or ident in diagram_ids:
            errors.append(f'Duplicate/missing diagram ID: {ident}')
        else:
            diagram_ids.add(ident)
        view = diagram.get('view')
        if not isinstance(view, str) or view not in {'as-is', 'as-designed', 'gap'}:
            errors.append(f'{ident}: invalid view')
        if not isinstance(diagram.get('type'), str) or not diagram.get('type'):
            errors.append(f'{ident}: missing diagram type')
        path = None
        try:
            path = project_path(root, diagram.get('path'))
            if path in diagram_paths:
                raise ValueError('Duplicate diagram path')
            diagram_paths.add(path)
            if not path.is_file() or path.suffix.lower() not in {'.puml', '.mmd'}:
                raise ValueError('Diagram source missing or unsupported')
        except (ValueError, OSError) as exc:
            errors.append(f'{ident}: {exc}')
        refs = diagram.get('requirement_ids', [])
        if not isinstance(refs, list) or any(not isinstance(x, str) for x in refs):
            errors.append(f'{ident}: requirement_ids must be string list');refs=[]
        for ref in refs:
            if ref not in req_ids:
                errors.append(f'{ident}: unknown requirement ID {ref}')
            linked.add(ref)
        elements, relationships = diagram.get('elements'), diagram.get('relationships')
        if not isinstance(elements, list) or not elements or not isinstance(relationships, list):
            errors.append(f'{ident}: nonempty elements and relationship list required');continue
        item_ids, node_ids = set(), set()
        for group, items in [('element',elements),('relationship',relationships)]:
            for item in items:
                if not isinstance(item, dict):
                    errors.append(f'{ident}: {group} must be object');continue
                item_id = item.get('id')
                where = f'{ident}/{item_id}'
                if not isinstance(item_id, str) or not item_id or item_id in item_ids:
                    errors.append(f'{where}: duplicate/missing item ID')
                else:
                    item_ids.add(item_id)
                    if group == 'element':node_ids.add(item_id)
                    signature = (group, item.get('label'), item.get('kind'), item.get('from'), item.get('to'))
                    if item_id in stable and stable[item_id] != signature:
                        errors.append(f'{where}: stable ID changes meaning across diagrams')
                    stable[item_id] = signature
                if not isinstance(item.get('label'), str) or not item.get('label') or not isinstance(item.get('kind'), str) or not item.get('kind'):
                    errors.append(f'{where}: label and kind required')
                status = item.get('status')
                if not isinstance(status, str) or status not in {'implemented','required','proposed','inferred'}:
                    errors.append(f'{where}: invalid status')
                if view == 'as-is' and isinstance(status, str) and status in {'required','proposed'}:
                    errors.append(f'{where}: unsupported status for as-is')
                if isinstance(status, str) and status in {'proposed','inferred'} and not item.get('rationale'):
                    errors.append(f'{where}: rationale required')
                sources(item, where, mandatory=status != 'proposed', diagram_path=path)
        for rel in relationships:
            if isinstance(rel,dict) and (not isinstance(rel.get('from'), str) or not isinstance(rel.get('to'), str) or rel.get('from') not in node_ids or rel.get('to') not in node_ids):
                errors.append(f'{ident}/{rel.get("id")}: relationship endpoint missing in diagram')
    for req_id in sorted(req_ids-linked):
        warnings.append(f'{req_id}: not linked to a diagram; explain scope or gap in traceability')
    return errors, warnings


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--project', default='.')
    parser.add_argument('--manifest', default='docs/design/diagram-manifest.json')
    parser.add_argument('--report', default='docs/design/evidence-audit.json')
    args = parser.parse_args(argv)
    root = Path(args.project).resolve()
    try:
        manifest = project_path(root, args.manifest)
        report_path = project_path(root, args.report)
        if report_path == manifest or report_path.suffix.lower() != '.json':
            raise ValueError('Report must be a separate .json file')
    except ValueError as exc:
        parser.error(str(exc))
    try:
        data = json.loads(manifest.read_text(encoding='utf-8-sig'))
        errors, warnings = audit(root, data)
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        errors, warnings = [str(exc)], []
    report = {'schema_version':1, 'status':'failed' if errors else 'passed',
              'errors':errors, 'warnings':warnings,
              'scope':'Metadata only; citations must still be reviewed for semantic support.'}
    report_path.parent.mkdir(parents=True,exist_ok=True)
    report_path.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'status':report['status'],'errors':len(errors),'warnings':len(warnings),'report':str(report_path)}))
    return 1 if errors else 0


if __name__ == '__main__':
    sys.exit(main())
