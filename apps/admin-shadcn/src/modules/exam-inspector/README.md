# Exam inspector block adapters

Registry logic imports ProseMirror and Zod, never the engine.
`lib/block-registry.ts` exposes the ordered 23-entry `BLOCK_SCHEMAS` catalog and
`matchBlockSchema(node)`. Fields describe nested list controls as well as scalar
inputs. No derived values or template identifiers are added to the document.

## Live inspector

- `useExamInspector` owns an editor-scoped, non-persisted Zustand store. Block positions and ephemeral identities are mapped through transactions; no document attributes are added.
- Explicit canvas clicks and template insertion open the properties tab, even after the user closes the rail. Keyboard/caret navigation updates the active block without changing the tab; ordinary typing never reopens the rail.
- Forms use the registry schema with React Hook Form and `zodResolver`. Invalid edits stay in the form and do not dispatch. Nested lists follow their existing structural restrictions.
- Own writes are tagged and never fed back into the form. External changes update individual fields, excluding the focused field (and a containing list if its dimensions changed). Leaving the form reconciles deferred values. Ctrl/Cmd+Z inside a form invokes editor history, including its focused field; Shift+Ctrl/Cmd+Z redoes.
- Normal editor history groups consecutive typing. Switching fields or pausing for a second explicitly starts a new group. Block deletion is undoable.
- Semantic text anchors (passage, rubric header, end) retain their adapter while active so editing their identifying text does not remove the focused form. Selecting another block restores normal structural matching.
- The highlight and badge are a fixed, print-hidden body portal, never children/decorations/widgets of the measured document. Scroll, resize, document changes and completed layout transitions refresh their bounds.
- Base UI's accordion is a direct admin dependency: the engine TypeScript project's `rootDir` cannot include the shared Collapsible's TypeScript source. No shared UI source is changed.
- E2E IDs: `inspector-tab`, `inspector-item-{templateId}` (may repeat for multiple instances), `inspector-field-{path}` (nested example: `options.0.text`), `inspector-badge-edit`, `inspector-badge-delete`.

## Transaction contract

- `read(node)` derives form values from the current node, not cached state.
- `write(tr, pos, node, values)` accepts a partial top-level values object; supplied
  lists are complete replacements. Values are strictly Zod-validated before any
  steps are added. Invalid values/positions throw; callers should show validation
  errors rather than dispatch. `pos` and `node` must refer to the supplied
  transaction's current document. The returned transaction is not dispatched.
- No-op writes add no steps. Attribute edits use `setNodeMarkup`; content edits
  target changed descendants, not the whole document. Dispatch once for one undo
  action. Untouched inline math, images, marks and neighboring nodes are retained.
- Replacing a text slot intentionally replaces its entire inline content using
  the first text descendant's marks and preserves the slot node's attributes.
  Blank values retain existing empty slots. Optional missing slots are only
  created for nonempty values. Existing generic formatting belongs to the ribbon;
  paragraph/divider/page-break/TOC adapters therefore expose no fields. In
  particular, TOC has no persisted levels setting to expose.
- No correct-answer field is offered on questions: this schema has no such attr;
  answers reside in the separate answer-key table. Essay points map to `score`;
  rubric points remain part of each item's actual text, not a fabricated attr.
- Answer-key tables expose cell text, preserving table/row/cell attrs, spans and
  header cell types. Table/row/cell counts are fixed (metadata `fixedLength`);
  newlines edit the cell's paragraph slots. Non-table labels are left untouched.
  List levels likewise target existing items. Grid column edits change only the
  existing `cols` attr, not cell content or count.

## Header slots

Left column (excluding a recognized `Mã đề:` line): indices 0/1/2 are `soGiaoDuc`,
`tenTruong`, `loaiDe`. Right column indices 0/1/2/3 are `kyThi`, `namHoc`, `monThi`,
`thoiGian`. Subject values exclude the `Môn thi:` prefix. Duration reads integer
minutes before `phút`, or null if unparseable. Writing minutes preserves any
existing duration prefix/suffix; without a recognized duration it writes
`Thời gian làm bài: N phút`. Clearing duration writes an empty line.

`maDe` reads a recognized left-column code line. A nonempty write inserts a plain
paragraph `Mã đề: VALUE` immediately after the exam-type line if absent, using the
same paragraph node type as the template. Existing code-line attrs/marks are
preserved. Clearing an existing code keeps `Mã đề: `; no empty code is inserted
when absent. Missing positional slots are padded with empty paragraphs when a
later field needs insertion. No page-setup values are modified.

## Matching and multi-node anchors

Node type plus existing attrs/structure identify question kinds (`kind`), list
variants (`ordered`, child `level`) and grids (`cols`). Changing those attrs can
legitimately change the matched adapter. IDs are never used to infer provenance.

There is no lossless provenance for sibling templates without new persisted
metadata. The passage anchor is its introduction paragraph starting with `Đọc`
and containing `đoạn`, `ngữ liệu`, `trích` or `văn bản`. It edits only that
introduction; poetry/author siblings remain ordinary paragraphs. The
rubric-header anchor is the `examHeading` starting with `HƯỚNG DẪN CHẤM`; it edits
only that heading. The neighboring page break, rubric and subsequent heading use
their own adapters. `Dòng HẾT` is recognized by its text between optional dashes.

Editing away those recognizable texts makes them fall back to the generic
paragraph/heading adapter. An unrelated block with the same text is inherently
indistinguishable. The registry does not claim to recover template provenance or
edit a multi-node group from a single node. Selection code in the next step must
resolve the top-level canvas node, then re-read/re-match after transactions.
