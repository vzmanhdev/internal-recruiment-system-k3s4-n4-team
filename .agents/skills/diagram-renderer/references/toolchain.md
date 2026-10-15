# Local toolchain and portable execution

## Requirements

- Python 3.10+ for bundled helper scripts (standard library only).
- PlantUML: Java and a local PlantUML JAR. Some diagram types also require Graphviz `dot` or a configured supported alternate layout engine. Check `java -jar <jar> -version` and `java -jar <jar> -testdot` for the specific installation. Obtain the JAR from the official release page and keep the selected version fixed for reproducibility.
- Mermaid: Node.js plus Mermaid CLI `mmdc` and a functioning browser/Chromium dependency. Use the project's pinned version if available. Check `mmdc --version`. A browser launch failure is a renderer failure, not proof that the Mermaid source is invalid.
- C4: the library bundled with your PlantUML version (`!include <C4/C4_Container>` etc.). If unsupported, use a versioned local library with license and provenance. Do not use remote `master` includes.

Official installation references:
- https://plantuml.com/download
- https://plantuml.com/command-line
- https://plantuml.com/graphviz-dot
- https://github.com/mermaid-js/mermaid-cli
- https://github.com/plantuml-stdlib/C4-PlantUML

Install Mermaid CLI manually when needed: `npm install --save-dev @mermaid-js/mermaid-cli@<selected-version>` after choosing a supported version. This bundle never runs `npm install`, `npx` network fetches or downloads automatically.

## Commands

From project root on Windows or Linux/macOS:

```text
python <skill-dir>/scripts/render_diagrams.py --help
python <skill-dir>/scripts/render_diagrams.py --project . --input docs/diagrams --plantuml-jar C:/tools/plantuml.jar --format both
python <skill-dir>/scripts/audit_manifest.py --project . --manifest docs/design/diagram-manifest.json
```

Use the actual local path instead of `<skill-dir>`. The JAR can be supplied explicitly or discovered from `PLANTUML_JAR`, `tools/plantuml.jar` or `.tools/plantuml.jar`. `--mmdc` selects an explicit CLI path if it is not on PATH or in `node_modules/.bin`. `--java` selects a Java binary. `--timeout` caps each subprocess. Optional `--puppeteer-config` selects an existing browser config for Mermaid; use only a config appropriate for the user's environment, not a blanket `--no-sandbox` workaround.

The render script accepts standalone `.puml` and `.mmd`, one diagram per file. Keep PlantUML `@startuml` without an output-name suffix and `@enduml`, local includes resolving from the source directory, and no markdown fences. Reports and outputs must remain within the project. SVG and PNG exports go beside the input file by default. With `--output-dir <folder>`, they are written in that folder preserving paths relative to the input directory (or directly in the folder for a single input file). The helper rejects `.puml`/`.mmd` inputs with identical output stems to prevent overwrites. Use `--input docs/uml/sources --output-dir docs/uml/images --format both` for a dedicated images-only folder. Failed/blocked input exports are removed first so old images cannot masquerade as current output.

Manifest audit exit codes: 0 pass, 1 invalid evidence metadata. Render exit codes: 0 all selected files passed, 1 at least one failed/blocked or no inputs. Neither script proves business semantics. Do not execute examples as project evidence.
