export function exportToCsv(filename, rows) {
  if (!rows.length) return

  const separator = ","
  const keys = Object.keys(rows[0])

  const csvContent =
    keys.join(separator) +
    "\n" +
    rows
      .map(row =>
        keys
          .map(k => {
            let cell = row[k] === null || row[k] === undefined ? "" : row[k]
            cell = cell instanceof Date ? cell.toLocaleString() : cell.toString()
            if (cell.search(/("|,|\n)/g) >= 0)
              cell = `"${cell.replace(/"/g, '""')}"`
            return cell
          })
          .join(separator)
      )
      .join("\n")

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", filename)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}
