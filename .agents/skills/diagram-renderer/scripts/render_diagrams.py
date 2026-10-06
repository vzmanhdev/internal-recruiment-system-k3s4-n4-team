#!/usr/bin/env python3
"""Render standalone PlantUML/Mermaid locally. Does not install tools."""
import argparse
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
import xml.etree.ElementTree as ET


def inside(root, value):
    path = Path(value)
    path = (root / path).resolve() if not path.is_absolute() else path.resolve()
    if not path.is_relative_to(root):
        raise ValueError(f'Path must be inside project: {value}')
    return path


def run(command, cwd, timeout, data=None):
    proc = subprocess.run(command, cwd=cwd, input=data, stdout=subprocess.PIPE,
                          stderr=subprocess.PIPE, timeout=timeout, shell=False)
    if proc.returncode:
        detail = (proc.stderr or proc.stdout).decode('utf-8', errors='replace')[-4000:]
        raise RuntimeError(f'Command exited {proc.returncode}: {detail}')
    return proc


def executable(value):
    found = shutil.which(str(value))
    if found:
        return found
    path = Path(value).expanduser()
    return str(path.resolve()) if path.is_file() else None


def valid_image(path, fmt):
    if not path.is_file() or path.stat().st_size == 0:
        raise RuntimeError('Renderer produced no image')
    if fmt == 'png':
        if not path.read_bytes().startswith(b'\x89PNG\r\n\x1a\n'):
            raise RuntimeError('Output is not PNG')
    else:
        try:
            root = ET.parse(path).getroot()
        except ET.ParseError as exc:
            raise RuntimeError(f'Output is not valid SVG XML: {exc}') from exc
        if root.tag.split('}')[-1] != 'svg':
            raise RuntimeError('Output root is not SVG')


def preflight(path, source):
    if '```' in source:
        raise ValueError('Remove Markdown fences from standalone diagram source')
    if path.suffix.lower() == '.puml':
        lines = source.splitlines()
        starts = [x.strip() for x in lines if x.strip().startswith('@startuml')]
        ends = [x.strip() for x in lines if x.strip().startswith('@enduml')]
        if starts != ['@startuml'] or ends != ['@enduml']:
            raise ValueError('Require one plain @startuml and @enduml block per file')
        if re.search(r'^\s*!include\w*\s+.*(?:https?://|ftp://)', source, re.I | re.M):
            raise ValueError('Remote PlantUML includes are disabled; use standard library or local files')


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--project', default='.')
    parser.add_argument('--input', default='docs/diagrams', help='File or directory inside project')
    parser.add_argument('--output-dir', help='Separate export folder inside project; preserves input subfolders')
    parser.add_argument('--plantuml-jar', help='Existing local JAR; no downloads')
    parser.add_argument('--java', default='java')
    parser.add_argument('--mmdc', help='Existing Mermaid CLI path')
    parser.add_argument('--puppeteer-config', help='Existing local browser config')
    parser.add_argument('--format', choices=['svg', 'png', 'both'], default='svg')
    parser.add_argument('--timeout', type=int, default=90, help='Seconds per subprocess')
    parser.add_argument('--report', default='docs/design/render-report.json')
    args = parser.parse_args(argv)
    root = Path(args.project).resolve()
    if not root.is_dir() or args.timeout < 1:
        parser.error('Project must exist and timeout must be positive')
    try:
        target = inside(root, args.input)
        report_path = inside(root, args.report)
        output_root = inside(root, args.output_dir) if args.output_dir else None
        if report_path.suffix.lower() != '.json':
            raise ValueError('Report path must end with .json')
    except ValueError as exc:
        parser.error(str(exc))
    candidates = [target] if target.is_file() else sorted(target.rglob('*')) if target.is_dir() else []
    paths = [p for p in candidates if p.suffix.lower() in {'.puml', '.mmd'} and p.is_file()]
    paths = [p for p in paths if p.resolve().is_relative_to(root)]
    output_stems = {}
    stems_seen = set()
    for path in paths:
        relative_source = Path(path.name) if target.is_file() else path.relative_to(target)
        stem = inside(root, str(output_root/relative_source.with_suffix(''))) if output_root else path.with_suffix('')
        if stem in stems_seen:
            parser.error('Diagram sources map to the same output stem: '+str(stem))
        stems_seen.add(stem)
        output_stems[path] = stem
    if output_root and report_path.is_relative_to(output_root):
        parser.error('Keep JSON reports outside the separate image folder')
    java = executable(args.java)
    jar_arg = args.plantuml_jar or os.environ.get('PLANTUML_JAR')
    jar = Path(jar_arg).expanduser() if jar_arg else next((p for p in [root/'tools/plantuml.jar', root/'.tools/plantuml.jar'] if p.is_file()), None)
    if jar is not None:
        jar = (root/jar).resolve() if not jar.is_absolute() else jar.resolve()
    local_mmdc = root / 'node_modules' / '.bin' / ('mmdc.cmd' if os.name == 'nt' else 'mmdc')
    mmdc = executable(args.mmdc) if args.mmdc else executable(str(local_mmdc)) or executable('mmdc')
    browser_config = Path(args.puppeteer_config).expanduser().resolve() if args.puppeteer_config else None
    modern_plantuml = False
    if java and jar and jar.is_file():
        try:
            help_result = run([java, '-jar', str(jar), '-help'], root, args.timeout)
            modern_plantuml = b'--check-syntax' in help_result.stdout
        except (RuntimeError, OSError, subprocess.TimeoutExpired):
            pass
    formats = ['svg', 'png'] if args.format == 'both' else [args.format]
    results = []
    versions = {}
    for name, command in [('plantuml', [java, '-jar', str(jar), '-version'] if java and jar and jar.is_file() else None),
                          ('mermaid', [mmdc, '--version'] if mmdc else None)]:
        if command:
            try:
                proc = run(command, root, args.timeout)
                versions[name] = (proc.stdout + proc.stderr).decode('utf-8', errors='replace').strip()[:2000]
            except (RuntimeError, OSError, subprocess.TimeoutExpired) as exc:
                versions[name] = f'Version check failed: {exc}'
    for path in paths:
        relative = path.relative_to(root).as_posix()
        row = {'path': relative, 'status': 'failed', 'outputs': [], 'commands': []}
        made = []
        temp_path = None
        try:
            # Always remove stale exports, including the other format, before work.
            for fmt in ['svg', 'png']:
                Path(str(output_stems[path]) + '.' + fmt).unlink(missing_ok=True)
            source = path.read_text(encoding='utf-8-sig')
            preflight(path, source)
            if path.suffix.lower() == '.puml':
                if not java or not jar or not jar.is_file():
                    row.update(status='blocked', reason='Java or local PlantUML JAR unavailable')
                    results.append(row)
                    continue
                command = [java, '-Djava.awt.headless=true', '-jar', str(jar), *(['--check-syntax', '--check-before-run', '--charset', 'UTF-8'] if modern_plantuml else ['-checkonly', '-failfast2', '-charset', 'UTF-8']), str(path)]
                row['commands'].append(command)
                run(command, path.parent, args.timeout)
            elif not mmdc:
                row.update(status='blocked', reason='Mermaid CLI mmdc unavailable')
                results.append(row)
                continue
            if path.suffix.lower() == '.mmd' and browser_config and not browser_config.is_file():
                raise ValueError('Puppeteer config does not exist')
            for fmt in formats:
                output_stems[path].parent.mkdir(parents=True, exist_ok=True)
                fd, temp_name = tempfile.mkstemp(prefix='.diagram-', suffix='.' + fmt, dir=output_stems[path].parent)
                os.close(fd)
                temp_path = Path(temp_name)
                if path.suffix.lower() == '.puml':
                    command = [java, '-Djava.awt.headless=true', '-jar', str(jar), *(['--' + fmt, '--pipe', '--check-before-run', '--charset', 'UTF-8'] if modern_plantuml else ['-t' + fmt, '-pipe', '-failfast2', '-charset', 'UTF-8'])]
                    row['commands'].append(command)
                    proc = run(command, path.parent, args.timeout, source.encode('utf-8'))
                    temp_path.write_bytes(proc.stdout)
                else:
                    command = [mmdc, '-i', str(path), '-o', str(temp_path), '-b', 'white']
                    if browser_config:
                        command += ['-p', str(browser_config)]
                    row['commands'].append(command)
                    run(command, path.parent, args.timeout)
                valid_image(temp_path, fmt)
                final = Path(str(output_stems[path]) + '.' + fmt)
                os.replace(temp_path, final)
                temp_path = None
                made.append(final)
            row.update(status='passed', outputs=[p.relative_to(root).as_posix() for p in made])
        except (ValueError, RuntimeError, OSError, subprocess.TimeoutExpired) as exc:
            for output in made:
                output.unlink(missing_ok=True)
            row.update(status='failed', reason=str(exc), outputs=[])
        finally:
            if temp_path:
                temp_path.unlink(missing_ok=True)
        results.append(row)
    passed = bool(results) and all(row['status'] == 'passed' for row in results)
    report = {'schema_version': 1, 'status': 'passed' if passed else 'incomplete',
              'tool_versions': versions, 'files': results,
              'scope': 'Syntax/render only; semantic and visual review must be performed separately.'}
    if not paths:
        report['reason'] = 'No .puml or .mmd input files found inside project'
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'status': report['status'], 'file_count': len(results), 'report': str(report_path)}))
    return 0 if passed else 1


if __name__ == '__main__':
    sys.exit(main())
