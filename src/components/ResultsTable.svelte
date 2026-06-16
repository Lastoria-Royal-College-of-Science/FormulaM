<script lang="ts">
  import ChemicalFormula from "./ChemicalFormula.svelte";
  import {
    cycleResultSortState,
    getResultSortAria,
    getResultSortIconClass,
    sortFormulaHits,
    type ResultSortColumn,
    type ResultSortState,
  } from "../core/resultsSort";
  import { matchesAssignmentHit } from "../core/assignments";
  import type { FormulaHit, PeakAssignment } from "../core/types";

  type ResultsPageSizeValue = "10" | "20" | "50" | "all";

  const pageSizeOptions: Array<{ label: string; value: ResultsPageSizeValue }> = [
    { label: "10", value: "10" },
    { label: "20", value: "20" },
    { label: "50", value: "50" },
    { label: "All", value: "all" },
  ];

  export let results: FormulaHit[] = [];
  export let selectedPeakLabel = "";
  export let activeAssignment: PeakAssignment | null = null;
  export let onToggleAssignment: ((hit: FormulaHit) => void) | null = null;

  let sortState: ResultSortState | null = null;
  let pageSizeValue: ResultsPageSizeValue = "10";
  let currentPage = 1;
  let previousResults: FormulaHit[] = results;

  $: sortedResults = sortFormulaHits(results, sortState);
  $: if (results !== previousResults) {
    previousResults = results;
    currentPage = 1;
  }
  $: resolvedPageSize = pageSizeValue === "all" ? null : Number(pageSizeValue);
  $: totalResults = sortedResults.length;
  $: totalPages = resolvedPageSize === null || totalResults === 0 ? 1 : Math.ceil(totalResults / resolvedPageSize);
  $: if (currentPage > totalPages) currentPage = totalPages;
  $: pageStart = resolvedPageSize === null ? 0 : (currentPage - 1) * resolvedPageSize;
  $: pageEnd = resolvedPageSize === null ? totalResults : Math.min(totalResults, pageStart + resolvedPageSize);
  $: visibleResults = sortedResults.slice(pageStart, pageEnd);
  $: paginationSummary = totalResults === 0 ? "Showing 0 results" : `Showing ${pageStart + 1}-${pageEnd} of ${totalResults}`;

  function toggleSort(column: ResultSortColumn): void {
    sortState = cycleResultSortState(sortState, column);
  }

  function goToPage(nextPage: number): void {
    currentPage = Math.min(Math.max(nextPage, 1), totalPages);
  }

  function toggleAssignment(hit: FormulaHit): void {
    onToggleAssignment?.(hit);
  }

  function assignmentAriaLabel(hit: FormulaHit, isAssigned: boolean): string {
    return isAssigned ? `Remove ${hit.ion_formula} from the selected peak` : `Assign ${hit.ion_formula} to the selected peak`;
  }
</script>

<section class="ui-card">
  <div class="mb-3 flex flex-wrap items-start justify-between gap-3">
    <div>
      <h2 class="mt-0">Candidate formulae</h2>
      {#if onToggleAssignment}
        <p class="mb-0 mt-1 text-sm text-muted">
          {#if selectedPeakLabel}
            Assigning against selected peak {selectedPeakLabel}.
          {:else}
            Select a peak in the spectrum plot to enable assignment.
          {/if}
        </p>
      {/if}
    </div>
    <div class="flex flex-wrap items-center gap-2 text-sm text-muted">
      <span>Rows per page</span>
      <select
        id="results-page-size"
        class="field-control field-select min-h-9 min-w-[4.75rem] w-[4.75rem] pl-3 pr-11 py-1.5 text-sm"
        aria-label="Rows per page"
        bind:value={pageSizeValue}
        on:change={() => (currentPage = 1)}
      >
        {#each pageSizeOptions as option}
          <option value={option.value}>{option.label}</option>
        {/each}
      </select>
    </div>
  </div>
  <div class="w-full overflow-x-auto">
    <table class="w-full border-collapse whitespace-nowrap tabular-nums">
      <thead>
        <tr>
          <th class="table-head">Formula</th>
          <th class="table-head" aria-sort={getResultSortAria(sortState, "mass")}>
            <button
              type="button"
              class={`results-sort-button ${sortState?.column === "mass" ? "text-text" : ""}`}
              aria-label="Sort by neutral mass"
              on:click={() => toggleSort("mass")}
            >
              <span>Neutral mass</span>
              <span
                aria-hidden="true"
                class={`results-sort-icon ${getResultSortIconClass(sortState, "mass")} ${sortState?.column === "mass" ? "text-accent" : "text-muted"}`}
              ></span>
            </button>
          </th>
          <th class="table-head" aria-sort={getResultSortAria(sortState, "mz")}>
            <button
              type="button"
              class={`results-sort-button ${sortState?.column === "mz" ? "text-text" : ""}`}
              aria-label="Sort by predicted m/z"
              on:click={() => toggleSort("mz")}
            >
              <span>Predicted <code class="inline-code">m/z</code></span>
              <span
                aria-hidden="true"
                class={`results-sort-icon ${getResultSortIconClass(sortState, "mz")} ${sortState?.column === "mz" ? "text-accent" : "text-muted"}`}
              ></span>
            </button>
          </th>
          <th class="table-head" aria-sort={getResultSortAria(sortState, "error_da")}>
            <button
              type="button"
              class={`results-sort-button ${sortState?.column === "error_da" ? "text-text" : ""}`}
              aria-label="Sort by error in daltons"
              on:click={() => toggleSort("error_da")}
            >
              <span>Error (Da)</span>
              <span
                aria-hidden="true"
                class={`results-sort-icon ${getResultSortIconClass(sortState, "error_da")} ${sortState?.column === "error_da" ? "text-accent" : "text-muted"}`}
              ></span>
            </button>
          </th>
          <th class="table-head" aria-sort={getResultSortAria(sortState, "error_ppm")}>
            <button
              type="button"
              class={`results-sort-button ${sortState?.column === "error_ppm" ? "text-text" : ""}`}
              aria-label="Sort by error in ppm"
              on:click={() => toggleSort("error_ppm")}
            >
              <span>Error (ppm)</span>
              <span
                aria-hidden="true"
                class={`results-sort-icon ${getResultSortIconClass(sortState, "error_ppm")} ${sortState?.column === "error_ppm" ? "text-accent" : "text-muted"}`}
              ></span>
            </button>
          </th>
          {#if onToggleAssignment}
            <th class="table-head w-[48px]" aria-label="Toggle assignment"></th>
          {/if}
        </tr>
      </thead>
      <tbody>
        {#each visibleResults as hit}
          {@const isAssigned = matchesAssignmentHit(activeAssignment, hit)}
          <tr class={isAssigned ? "results-row-active" : "odd:bg-row"}>
            <td class="table-cell"><ChemicalFormula formula={hit.ion_formula} /></td>
            <td class="table-cell">{hit.mass}</td>
            <td class="table-cell">{hit.mz}</td>
            <td class="table-cell">{hit.error_da}</td>
            <td class="table-cell">{hit.error_ppm}</td>
            {#if onToggleAssignment}
              <td class="table-cell w-[48px] text-right">
                <button
                  type="button"
                  class={isAssigned ? "results-assign-button-active" : "results-assign-button"}
                  aria-label={assignmentAriaLabel(hit, isAssigned)}
                  aria-pressed={isAssigned}
                  disabled={!selectedPeakLabel}
                  on:click={() => toggleAssignment(hit)}
                >
                  <span class={`results-assign-icon ${isAssigned ? "i-mdi-minus" : "i-mdi-add"}`} aria-hidden="true"></span>
                </button>
              </td>
            {/if}
          </tr>
        {:else}
          <tr>
            <td colspan={onToggleAssignment ? 6 : 5} class="table-cell px-2 py-4.5 text-center text-muted">No candidate formulae matched the current search.</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
    <div class="text-sm text-muted" aria-live="polite">{paginationSummary}</div>
    <div class="flex flex-wrap items-center gap-2">
      <span class="text-sm text-muted">Page {currentPage} of {totalPages}</span>
      <button
        type="button"
        class="secondary-action min-h-9 rounded-[10px] px-3 py-1.5 text-sm"
        aria-label="Go to previous results page"
        disabled={currentPage <= 1}
        on:click={() => goToPage(currentPage - 1)}
      >
        Previous
      </button>
      <button
        type="button"
        class="secondary-action min-h-9 rounded-[10px] px-3 py-1.5 text-sm"
        aria-label="Go to next results page"
        disabled={currentPage >= totalPages}
        on:click={() => goToPage(currentPage + 1)}
      >
        Next
      </button>
    </div>
  </div>
</section>
