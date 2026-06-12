<script lang="ts">
  import { elementOptionsForRow } from "../core/searchSpace";
  import { formatIsotopeOption } from "../core/massData";
  import type { FormulaSpaceRow, MassIndex } from "../core/types";

  export let rows: FormulaSpaceRow[] = [];
  export let massIndex: MassIndex;
  export let disabled = false;
  export let onAddRow: () => void;
  export let onRemoveRow: (rowId: number) => void;
  export let onUpdateRow: (rowId: number, patch: Partial<FormulaSpaceRow>) => void;

  $: canAddRow = elementOptionsForRow(rows, massIndex, null).length > 0;
</script>

<section class="card" aria-label="Formula search space">
  <div class="section-header">
    <div>
      <h2>Formula search space</h2>
      <p>Use one row per isotope-specific species. Repeated elements are allowed when different isotopes are selected.</p>
    </div>
  </div>

  <div class="formula-table-wrap">
    <table class="formula-table">
      <thead>
        <tr>
          <th>Element</th>
          <th>Isotope</th>
          <th>Lower limit</th>
          <th>Upper limit</th>
          <th aria-label="Remove row"></th>
        </tr>
      </thead>
      <tbody>
        {#each rows as row (row.id)}
          <tr>
            <td>
              <select
                value={row.element}
                disabled={disabled}
                aria-label="Element"
                on:change={(event) => onUpdateRow(row.id, { element: (event.currentTarget as HTMLSelectElement).value })}
              >
                {#each elementOptionsForRow(rows, massIndex, row.id) as symbol}
                  <option value={symbol}>{symbol}</option>
                {/each}
              </select>
            </td>
            <td>
              <select
                value={row.isotope}
                disabled={disabled}
                aria-label="Isotope"
                on:change={(event) => onUpdateRow(row.id, { isotope: (event.currentTarget as HTMLSelectElement).value })}
              >
                {#each massIndex.isotopeOptions[row.element] || [] as isotope}
                  <option value={isotope}>{formatIsotopeOption(massIndex, isotope)}</option>
                {/each}
              </select>
            </td>
            <td>
              <input
                type="number"
                min="0"
                step="1"
                value={row.lower}
                disabled={disabled}
                aria-label="Lower limit"
                on:input={(event) => {
                  const value = (event.currentTarget as HTMLInputElement).value;
                  onUpdateRow(row.id, { lower: value === "" ? "" : Number(value) });
                }}
              />
            </td>
            <td>
              <input
                type="number"
                min="0"
                step="1"
                value={row.upper}
                disabled={disabled}
                aria-label="Upper limit"
                on:input={(event) => {
                  const value = (event.currentTarget as HTMLInputElement).value;
                  onUpdateRow(row.id, { upper: value === "" ? "" : Number(value) });
                }}
              />
            </td>
            <td>
              <button
                type="button"
                class="remove-row"
                title="Remove row"
                disabled={disabled || rows.length <= 1}
                on:click={() => onRemoveRow(row.id)}
              >-</button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  <div class="add-row-wrap">
    <button id="addRow" type="button" class="icon-button" title="Add row" disabled={disabled || !canAddRow} on:click={onAddRow}>+</button>
  </div>
</section>
