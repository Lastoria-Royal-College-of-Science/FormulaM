<script lang="ts">
  import { onDestroy, onMount } from "svelte";

  import Hero from "./components/layout/Hero.svelte";
  import TopBar from "./components/layout/TopBar.svelte";
  import ResultsTable from "./components/results/ResultsTable.svelte";
  import FormulaSpaceTable from "./components/search/FormulaSpaceTable.svelte";
  import SearchInputs from "./components/search/SearchInputs.svelte";
  import ExportPanel from "./components/spectrum/ExportPanel.svelte";
  import PeakInspector from "./components/spectrum/PeakInspector.svelte";
  import PlotSettingsPanel from "./components/spectrum/PlotSettingsPanel.svelte";
  import SpectrumImport from "./components/spectrum/SpectrumImport.svelte";
  import SpectrumPlot from "./components/spectrum/SpectrumPlot.svelte";
  import { BUSY_DISABLED_TITLE } from "./components/ui/disabledTitle";
  import { buildMassIndex, loadMassPayload } from "./core/chemistry/massData";
  import { downloadHitsCsv } from "./core/export/csv";
  import { downloadAssignmentsCsv } from "./core/export/spectrumCsv";
  import { downloadAnnotatedSpectrumPdf } from "./core/export/spectrumPdf";
  import { downloadAnnotatedSpectrumPng } from "./core/export/spectrumPng";
  import { createPlotSettings, DEFAULT_PLOT_SETTINGS } from "./core/plot/plotTicks";
  import {
    canCommitChargeEntryText,
    createChargeEntry,
    isChargeDraftText,
  } from "./core/search/chargeInput";
  import { findFormulaeForCharges } from "./core/search/search";
  import {
    createDefaultSearchForm,
    hasCommittedCharges,
    hasEnabledTolerance,
    selectedCharges,
    selectedTolerance,
  } from "./core/search/searchForm";
  import {
    chooseUnusedIsotope,
    createInitialRows,
    enforceUniqueIsotopes,
    firstAvailableElement,
    makeRow,
    validateAndBuildElements,
  } from "./core/search/searchSpace";
  import {
    getAssignment,
    attachAssignmentsToPeaks,
    buildPeakAssignment,
    matchesAssignmentHit,
    removeAssignment,
    upsertAssignment,
  } from "./core/spectrum/assignments";
  import { loadSpectrumImportSource } from "./core/spectrum/spectrumImport";
  import {
    buildSpectrumPreview,
    normalizeSpectrumTable,
    suggestSpectrumSelection,
  } from "./core/spectrum/spectrumNormalize";
  import type {
    AppStatus,
    FormulaSearchRequest,
    FormulaHit,
    FormulaSpaceRow,
    MassIndex,
    PeakAssignment,
    PlotSettings,
    SearchFormState,
    SpectrumImportSheet,
    SpectrumImportSource,
    SpectrumPeak,
    SpectrumPreviewTable,
    ThemeName,
  } from "./core/types";
  import type { WorkerResponse } from "./workers/workerProtocol";

  let theme: ThemeName = "dark";
  let massIndex: MassIndex | null = null;
  let rows: FormulaSpaceRow[] = [];
  let nextRowId = 0;
  let nextChargeEntryId = 1;
  let results: FormulaHit[] = [];
  let form: SearchFormState = createDefaultSearchForm();
  let status: AppStatus = "loading";
  let hasSearched = false;
  let worker: Worker | null = null;
  let activeRequestId: string | null = null;
  let colorSchemeMediaQuery: MediaQueryList | null = null;

  let rawSpectrumPeaks: SpectrumPeak[] = [];
  let spectrumPeaks: SpectrumPeak[] = [];
  let spectrumAssignments: PeakAssignment[] = [];
  let selectedPeakId: string | null = null;
  let selectedPeak: SpectrumPeak | null = null;
  let selectedAssignment: PeakAssignment | null = null;
  let spectrumImportSource: SpectrumImportSource | null = null;
  let currentSpectrumImportSheet: SpectrumImportSheet | null = null;
  let spectrumPreview: SpectrumPreviewTable | null = null;
  let spectrumFileName = "";
  let spectrumMzColumn = "";
  let spectrumIntensityColumn = "";
  let spectrumActiveSheetName = "";
  let spectrumHasHeaderRow = true;
  let spectrumMzColumnIndex: number | null = null;
  let spectrumIntensityColumnIndex: number | null = null;
  let spectrumImportError = "";
  let includeUnassignedInAssignmentCsv = false;
  let plotSettings: PlotSettings = { ...DEFAULT_PLOT_SETTINGS };

  $: isBusy = status === "loading" || status === "running";
  $: spectrumPeaks = attachAssignmentsToPeaks(
    rawSpectrumPeaks,
    spectrumAssignments,
    selectedPeakId,
  );
  $: selectedPeak = spectrumPeaks.find((peak) => peak.id === selectedPeakId) ?? null;
  $: selectedAssignment = getAssignment(spectrumAssignments, selectedPeakId);
  $: assignedCount = spectrumAssignments.length;
  $: selectedPeakLabel = selectedPeak ? selectedPeak.mz.toFixed(6) : "";
  $: canExportAssignmentCsv =
    rawSpectrumPeaks.length > 0 && (includeUnassignedInAssignmentCsv || assignedCount > 0);
  $: appDisabledReason = isBusy ? BUSY_DISABLED_TITLE : "";
  $: searchDisabledReason = isBusy
    ? BUSY_DISABLED_TITLE
    : !massIndex
      ? "Wait for the mass database to finish loading."
      : !hasCommittedCharges(form)
        ? "Add at least one charge before searching."
        : !hasEnabledTolerance(form)
          ? "Enable at least one tolerance before searching."
          : "";
  $: hitsCsvDisabledReason = isBusy
    ? BUSY_DISABLED_TITLE
    : results.length === 0
      ? "Run a search with results before downloading formula hits."
      : "";
  $: assignmentDisabledReason =
    rawSpectrumPeaks.length === 0
      ? "Import a spectrum before assigning formulae to peaks."
      : selectedPeakLabel
        ? ""
        : "Select a spectrum peak before assigning formulae.";
  $: currentSpectrumImportSheet =
    spectrumImportSource?.sheets.find((sheet) => sheet.name === spectrumActiveSheetName) ??
    spectrumImportSource?.sheets[0] ??
    null;
  $: spectrumPreview = currentSpectrumImportSheet
    ? buildSpectrumPreview(currentSpectrumImportSheet.table, spectrumHasHeaderRow)
    : null;

  function applyTheme(nextTheme: ThemeName): void {
    theme = nextTheme;
    document.documentElement.dataset.theme = nextTheme;
  }

  function handleThemeMediaChange(): void {
    applyTheme(getSystemTheme());
  }

  function toggleTheme(): void {
    applyTheme(theme === "dark" ? "light" : "dark");
  }

  function getSystemTheme(): ThemeName {
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }

  function syncThemeWithSystem(): void {
    applyTheme(getSystemTheme());
  }

  function updateForm(patch: Partial<SearchFormState>): void {
    form = { ...form, ...patch };
  }

  function updatePlotSettings(patch: Partial<PlotSettings>): void {
    plotSettings = { ...plotSettings, ...patch };
  }

  function createChargeEntryId(): string {
    const id = `charge-${nextChargeEntryId}`;
    nextChargeEntryId += 1;
    return id;
  }

  function updateChargeInputText(value: string): void {
    if (!isChargeDraftText(value)) return;
    updateForm({ chargeInputText: value });
  }

  function updateChargeEditText(value: string): void {
    if (!isChargeDraftText(value)) return;
    updateForm({ chargeEditText: value });
  }

  function commitChargeInput(): void {
    if (!canCommitChargeEntryText(form.chargeInputText)) return;
    const entry = createChargeEntry(createChargeEntryId(), form.chargeInputText);
    updateForm({
      chargeEntries: [...form.chargeEntries, entry],
      chargeInputText: "",
    });
  }

  function removeChargeEntry(entryId: string): void {
    const nextEntries = form.chargeEntries.filter((entry) => entry.id !== entryId);
    if (form.chargeEditId === entryId) {
      updateForm({
        chargeEntries: nextEntries,
        chargeEditId: null,
        chargeEditText: "",
      });
      return;
    }
    updateForm({ chargeEntries: nextEntries });
  }

  function startChargeEdit(entryId: string): void {
    const entry = form.chargeEntries.find((candidate) => candidate.id === entryId);
    if (!entry) return;
    updateForm({
      chargeEditId: entry.id,
      chargeEditText: entry.text,
    });
  }

  function cancelChargeEdit(): void {
    if (!form.chargeEditId) return;
    updateForm({
      chargeEditId: null,
      chargeEditText: "",
    });
  }

  function commitChargeEdit(): void {
    if (!form.chargeEditId || !canCommitChargeEntryText(form.chargeEditText)) return;
    const updatedEntry = createChargeEntry(form.chargeEditId, form.chargeEditText);
    updateForm({
      chargeEntries: form.chargeEntries.map((entry) =>
        entry.id === updatedEntry.id ? updatedEntry : entry,
      ),
      chargeEditId: null,
      chargeEditText: "",
    });
  }

  function clearImportedSpectrumData(): void {
    rawSpectrumPeaks = [];
    spectrumAssignments = [];
    selectedPeakId = null;
    spectrumMzColumn = "";
    spectrumIntensityColumn = "";
    includeUnassignedInAssignmentCsv = false;
    plotSettings = { ...DEFAULT_PLOT_SETTINGS };
    results = [];
    hasSearched = false;
  }

  function clearSpectrumImportState(): void {
    spectrumImportSource = null;
    spectrumFileName = "";
    spectrumActiveSheetName = "";
    spectrumHasHeaderRow = true;
    spectrumMzColumnIndex = null;
    spectrumIntensityColumnIndex = null;
    spectrumImportError = "";
    clearImportedSpectrumData();
  }

  function resetPlotView(): void {
    if (!rawSpectrumPeaks.length) {
      plotSettings = { ...DEFAULT_PLOT_SETTINGS };
      return;
    }

    const nextView = createPlotSettings(rawSpectrumPeaks);
    plotSettings = {
      ...plotSettings,
      xMin: nextView.xMin,
      xMax: nextView.xMax,
    };
  }

  function updateRow(rowId: number, patch: Partial<FormulaSpaceRow>): void {
    if (!massIndex) return;
    const previous = rows.find((row) => row.id === rowId);
    if (!previous) return;

    let nextRows = rows.map((row) => (row.id === rowId ? { ...row, ...patch } : { ...row }));
    const updated = nextRows.find((row) => row.id === rowId);
    if (!updated) return;

    if (patch.element !== undefined && patch.element !== previous.element) {
      updated.isotope = chooseUnusedIsotope(nextRows, massIndex, updated.element, rowId);
      nextRows = enforceUniqueIsotopes(nextRows, massIndex, rowId);
    } else if (patch.isotope !== undefined && patch.isotope !== previous.isotope) {
      nextRows = enforceUniqueIsotopes(nextRows, massIndex, rowId, previous.isotope);
    }
    rows = nextRows;
  }

  function addRow(): void {
    if (!massIndex) return;
    const element = firstAvailableElement(rows, massIndex);
    rows = [...rows, makeRow(nextRowId, massIndex, rows, element, 0, 10)];
    nextRowId += 1;
  }

  function removeRow(rowId: number): void {
    if (rows.length <= 1) return;
    rows = rows.filter((row) => row.id !== rowId);
  }

  function buildRequest(): FormulaSearchRequest {
    if (!massIndex) throw new Error("Mass database is not loaded yet.");
    const maxResults = Number(form.maxResults);
    if (!Number.isInteger(maxResults) || maxResults < 1)
      throw new Error("Max results must be a positive integer.");
    const elements = validateAndBuildElements(rows, massIndex);
    const charges = selectedCharges(form);
    const { tolerancePpm, toleranceDa } = selectedTolerance(form);
    return {
      mz: form.mz,
      elements,
      charges,
      tolerancePpm,
      toleranceDa,
      maxResults,
      massIndex,
    };
  }

  function handleWorkerMessage(event: MessageEvent<WorkerResponse>): void {
    const response = event.data;
    if (response.requestId !== activeRequestId) return;
    if (response.type === "result") {
      results = response.hits;
      hasSearched = true;
      status = "success";
      return;
    }
    status = "error";
  }

  function runSearch(): void {
    try {
      const request = buildRequest();
      const requestId = crypto.randomUUID();
      activeRequestId = requestId;
      status = "running";

      if (worker) {
        worker.postMessage({ type: "search", requestId, payload: request });
        return;
      }

      // Fallback for unusual environments where Web Worker construction fails.
      const hits = findFormulaeForCharges(request);
      results = hits;
      hasSearched = true;
      status = "success";
    } catch (error) {
      console.error(error);
      status = "error";
    }
  }

  function downloadCsv(): void {
    if (results.length) downloadHitsCsv(results);
  }

  function importSourceLabel(sheetName: string): string {
    return spectrumImportSource && spectrumImportSource.sheets.length > 1
      ? `${spectrumFileName} / ${sheetName}`
      : spectrumFileName;
  }

  function isSpectrumImportSheet(candidate: unknown): candidate is SpectrumImportSheet {
    return Boolean(
      candidate &&
      typeof candidate === "object" &&
      "name" in candidate &&
      "table" in candidate &&
      Array.isArray((candidate as SpectrumImportSheet).table),
    );
  }

  function applySpectrumImportResult(sourceName: string, sheet: SpectrumImportSheet): void {
    if (!sheet) {
      throw new Error("Spectrum import failed: no active worksheet is selected.");
    }

    const imported = normalizeSpectrumTable(sheet.table, {
      sourceName,
      hasHeaderRow: spectrumHasHeaderRow,
      mzColumnIndex: spectrumMzColumnIndex,
      intensityColumnIndex: spectrumIntensityColumnIndex,
    });

    rawSpectrumPeaks = imported.peaks;
    spectrumAssignments = [];
    selectedPeakId = null;
    spectrumMzColumn = imported.mzColumn;
    spectrumIntensityColumn = imported.intensityColumn;
    includeUnassignedInAssignmentCsv = false;
    plotSettings = createPlotSettings(imported.peaks);
    results = [];
    hasSearched = false;
  }

  function applySuggestedSpectrumSelection(sheet: SpectrumImportSheet): void {
    const suggestion = suggestSpectrumSelection(sheet.table, sheet.suggestedHasHeaderRow);
    spectrumActiveSheetName = sheet.name;
    spectrumHasHeaderRow = suggestion.hasHeaderRow;
    spectrumMzColumnIndex = suggestion.mzColumnIndex;
    spectrumIntensityColumnIndex = suggestion.intensityColumnIndex;
  }

  function handleApplySpectrumSelection(
    sheet: SpectrumImportSheet | Event | null = currentSpectrumImportSheet,
  ): void {
    const resolvedSheet = isSpectrumImportSheet(sheet) ? sheet : currentSpectrumImportSheet;
    if (!resolvedSheet) return;

    try {
      spectrumImportError = "";
      const label = importSourceLabel(resolvedSheet.name);
      applySpectrumImportResult(label, resolvedSheet);
      status = "success";
    } catch (error) {
      console.error(error);
      clearImportedSpectrumData();
      spectrumImportError = error instanceof Error ? error.message : String(error);
      status = "error";
    }
  }

  function handleSpectrumSheetSelect(sheetName: string): void {
    if (!spectrumImportSource) return;
    const sheet = spectrumImportSource.sheets.find((candidate) => candidate.name === sheetName);
    if (!sheet) return;
    applySuggestedSpectrumSelection(sheet);
    handleApplySpectrumSelection(sheet);
  }

  function handleSpectrumHasHeaderRowSelect(value: boolean): void {
    spectrumHasHeaderRow = value;
    if (!currentSpectrumImportSheet) return;

    const suggestion = suggestSpectrumSelection(currentSpectrumImportSheet.table, value);
    if (spectrumMzColumnIndex === null) spectrumMzColumnIndex = suggestion.mzColumnIndex;
    if (spectrumIntensityColumnIndex === null)
      spectrumIntensityColumnIndex = suggestion.intensityColumnIndex;
  }

  function handleSpectrumMzColumnSelect(index: number | null): void {
    spectrumMzColumnIndex = index;
  }

  function handleSpectrumIntensityColumnSelect(index: number | null): void {
    spectrumIntensityColumnIndex = index;
  }

  async function handleSpectrumImport(file: File | null): Promise<void> {
    if (!file) {
      clearSpectrumImportState();
      status = "idle";
      return;
    }

    try {
      clearImportedSpectrumData();
      spectrumImportError = "";
      status = "running";

      spectrumImportSource = await loadSpectrumImportSource(file);
      spectrumFileName = file.name;

      const firstSheet = spectrumImportSource.sheets[0];
      if (!firstSheet)
        throw new Error(
          `Spectrum import failed: ${file.name} does not contain any readable tables.`,
        );

      applySuggestedSpectrumSelection(firstSheet);
      handleApplySpectrumSelection(firstSheet);
    } catch (error) {
      console.error(error);
      clearSpectrumImportState();
      spectrumImportError = error instanceof Error ? error.message : String(error);
      status = "error";
    }
  }

  function handlePeakSelect(peak: SpectrumPeak): void {
    selectedPeakId = peak.id;
    updateForm({ mz: peak.mz.toFixed(6) });
    status = "idle";
  }

  function handleAssign(hit: FormulaHit): void {
    if (!selectedPeak) return;
    spectrumAssignments = upsertAssignment(
      spectrumAssignments,
      buildPeakAssignment(selectedPeak, hit),
    );
    status = "success";
  }

  function isAssignedHitForSelectedPeak(hit: FormulaHit): boolean {
    return matchesAssignmentHit(selectedAssignment, hit);
  }

  function handleToggleAssignment(hit: FormulaHit): void {
    if (!selectedPeak) return;
    if (isAssignedHitForSelectedPeak(hit)) {
      handleRemoveAssignment(selectedPeak.id);
      return;
    }
    handleAssign(hit);
  }

  function handleRemoveAssignment(peakId: string): void {
    const previous = getAssignment(spectrumAssignments, peakId);
    spectrumAssignments = removeAssignment(spectrumAssignments, peakId);
    if (previous) {
      status = "success";
    }
  }

  function handleExportAssignments(): void {
    if (!canExportAssignmentCsv) return;
    downloadAssignmentsCsv(spectrumPeaks, includeUnassignedInAssignmentCsv);
    status = "success";
  }

  async function handleExportPng(): Promise<void> {
    if (!rawSpectrumPeaks.length) return;
    try {
      status = "running";
      await downloadAnnotatedSpectrumPng(spectrumPeaks, plotSettings, theme);
      status = "success";
    } catch (error) {
      console.error(error);
      status = "error";
    }
  }

  async function handleExportPdf(): Promise<void> {
    if (!rawSpectrumPeaks.length) return;
    try {
      status = "running";
      await downloadAnnotatedSpectrumPdf(spectrumPeaks, plotSettings, theme);
      status = "success";
    } catch (error) {
      console.error(error);
      status = "error";
    }
  }

  onMount(async () => {
    syncThemeWithSystem();

    colorSchemeMediaQuery = window.matchMedia("(prefers-color-scheme: light)");

    if (typeof colorSchemeMediaQuery.addEventListener === "function") {
      colorSchemeMediaQuery.addEventListener("change", handleThemeMediaChange);
    } else {
      // Safari and older browsers.
      colorSchemeMediaQuery.addListener(handleThemeMediaChange);
    }

    try {
      worker = new Worker(new URL("./workers/formulaSearch.worker.ts", import.meta.url), {
        type: "module",
      });
      worker.onmessage = handleWorkerMessage;
    } catch (error) {
      console.warn(
        "Formula search worker could not be created; falling back to main-thread search.",
        error,
      );
      worker = null;
    }

    try {
      const { payload, url } = await loadMassPayload();
      massIndex = buildMassIndex(payload);
      const initial = createInitialRows(massIndex);
      rows = initial.rows;
      nextRowId = initial.nextRowId;
      status = "idle";
    } catch (error) {
      console.error(error);
      status = "error";
    }
  });

  onDestroy(() => {
    worker?.terminate();
    if (colorSchemeMediaQuery) {
      if (typeof colorSchemeMediaQuery.removeEventListener === "function") {
        colorSchemeMediaQuery.removeEventListener("change", handleThemeMediaChange);
      } else {
        colorSchemeMediaQuery.removeListener(handleThemeMediaChange);
      }
    }
  });
</script>

<div id="top" class="min-h-screen">
  <TopBar {theme} onToggleTheme={toggleTheme} />

  <main class="page-shell">
    <Hero {theme} />

    <SpectrumImport
      activeSheetName={spectrumActiveSheetName}
      disabled={isBusy}
      disabledReason={appDisabledReason}
      hasHeaderRow={spectrumHasHeaderRow}
      importSource={spectrumImportSource}
      intensityColumnIndex={spectrumIntensityColumnIndex}
      intensityColumnName={spectrumIntensityColumn}
      peakCount={rawSpectrumPeaks.length}
      previewTable={spectrumPreview}
      sourceName={spectrumFileName}
      mzColumnIndex={spectrumMzColumnIndex}
      mzColumnName={spectrumMzColumn}
      importError={spectrumImportError}
      onApplySelection={handleApplySpectrumSelection}
      onImportFile={handleSpectrumImport}
      onSelectHasHeaderRow={handleSpectrumHasHeaderRowSelect}
      onSelectIntensityColumn={handleSpectrumIntensityColumnSelect}
      onSelectMzColumn={handleSpectrumMzColumnSelect}
      onSelectSheet={handleSpectrumSheetSelect}
    />

    <SpectrumPlot
      peaks={spectrumPeaks}
      settings={plotSettings}
      {theme}
      {selectedPeakId}
      onSelectPeak={handlePeakSelect}
      onResetView={resetPlotView}
    />

    {#if rawSpectrumPeaks.length > 0}
      <PlotSettingsPanel
        settings={plotSettings}
        peaks={spectrumPeaks}
        disabled={isBusy}
        disabledReason={appDisabledReason}
        onChange={updatePlotSettings}
      />
      <PeakInspector
        {selectedPeak}
        assignment={selectedAssignment}
        onRemoveAssignment={handleRemoveAssignment}
      />
    {/if}

    <SearchInputs
      {form}
      disabled={isBusy}
      disabledReason={appDisabledReason}
      onChange={updateForm}
      onChargeInputTextChange={updateChargeInputText}
      onChargeEditTextChange={updateChargeEditText}
      onCommitChargeInput={commitChargeInput}
      onCommitChargeEdit={commitChargeEdit}
      onCancelChargeEdit={cancelChargeEdit}
      onRemoveChargeEntry={removeChargeEntry}
      onStartChargeEdit={startChargeEdit}
    />

    {#if massIndex}
      <FormulaSpaceTable
        {rows}
        {massIndex}
        disabled={isBusy}
        disabledReason={appDisabledReason}
        onAddRow={addRow}
        onRemoveRow={removeRow}
        onUpdateRow={updateRow}
      />
    {/if}

    <section class="my-4 flex flex-wrap gap-3">
      <button
        type="button"
        class="primary-action"
        title={searchDisabledReason || undefined}
        disabled={Boolean(searchDisabledReason)}
        on:click={runSearch}>Find candidate formulae</button
      >
      <button
        id="downloadCsv"
        type="button"
        class="secondary-action"
        title={hitsCsvDisabledReason || undefined}
        disabled={Boolean(hitsCsvDisabledReason)}
        on:click={downloadCsv}>Download formula hits CSV</button
      >
    </section>

    {#if hasSearched}
      <ResultsTable
        {results}
        {selectedPeakLabel}
        activeAssignment={selectedAssignment}
        {assignmentDisabledReason}
        onToggleAssignment={rawSpectrumPeaks.length > 0 ? handleToggleAssignment : null}
      />
    {/if}

    {#if rawSpectrumPeaks.length > 0}
      <ExportPanel
        includeUnassigned={includeUnassignedInAssignmentCsv}
        canExportAssignments={canExportAssignmentCsv}
        disabled={isBusy}
        disabledReason={appDisabledReason}
        totalPeaks={rawSpectrumPeaks.length}
        {assignedCount}
        onIncludeUnassignedChange={(value) => (includeUnassignedInAssignmentCsv = value)}
        onExportAssignments={handleExportAssignments}
        onExportPng={handleExportPng}
        onExportPdf={handleExportPdf}
      />
    {/if}

    <footer class="pt-5.5 text-center text-[0.92rem] text-muted">
      © 2026 The Regents of the United Colleges, Lastoria Royal College of Science
    </footer>
  </main>
</div>
