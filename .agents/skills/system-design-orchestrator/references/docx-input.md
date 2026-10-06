# DOCX requirements ingestion

## Read DOCX without discarding tables

Use Python 3.10+ and the bundled standard-library-only extractor. Run `--help` first:

```text
python <orchestrator-skill>/scripts/extract_docx.py --project . --input docs/requirements/spec.docx
```

Optional: `--output docs/design/evidence/spec`. The default directory includes the input path hash to distinguish documents with identical filenames. Read `source.txt` and `extraction.json`. Cite 1-based lines of `source.txt` in the diagram manifest and preserve the original DOCX path/hash plus its paragraph or table-cell locator in specifications/traceability.

The extractor processes body paragraphs, tables (including nested tables and merge metadata), headers, footers, footnotes, endnotes, comments, paragraph styles, cached field text and text boxes. It extracts embedded media and records relationship IDs/targets without following external links. Read content in document order; do not collect all paragraphs first and append tables later. Style names help identify headings. Numbering metadata is recorded but automatic displayed list numbers are not computed.

For multiple DOCX files, preserve their separate extracts and compare related statements. If there are competing revisions with no stated authority, record conflicts and ask about only the unresolved choice that materially changes actor/flow design. Do not silently choose a newer filename as authoritative.

## Revisions, images and reading limits

The default current-view extract excludes deleted/moved-from text and includes insertions/moved-to text. Revisions are flagged. Use `--include-deletions` in a separate evidence directory when reviewing changed requirements; treat deleted text/comments as review context rather than automatically active requirements. Do not accept/reject revisions or edit the original DOCX.

Read only current media entries listed in `extraction.json`; a reused directory may contain media from an older extract. Inspect embedded screenshots/scans/figures with available image tools, or render the Word file with an existing local Word/LibreOffice conversion workflow. The extractor performs no OCR and cannot resolve SmartArt, embedded OLE objects, altChunk documents, equations or charts comprehensively. A successful text extraction is not proof that every visual requirement was read. Flag any visual or embedded content that could not be inspected.

Do not infer page numbers from XML; paragraphs may reflow with fonts or paper size. If page citations are required, use actual rendered page numbering. If the host has a document skill, follow its reading/render instructions for visual review. Do not install a document conversion tool automatically.

## Goal and sequence design

- Build actor/goal and workflow tables from the actual document before drawing.
- Tie sequence participants to documented business responsibilities; mark inferred/proposed implementation participants. Do not invent a database/API/service layer when only a business narrative is supplied.
- Use correct include/extend semantics and nontechnical actor goals.
- Use Vietnamese labels and ASCII aliases. Break long titles and split large diagrams into readable module/flow slices.
- Keep PNG/SVG in `docs/uml/images/usecase/` and `docs/uml/images/sequence/`; source `.puml` goes into sibling `sources/` directories. Respect a custom destination from the user.
- Keep originals unchanged and store extraction evidence under `docs/design/evidence/`.
