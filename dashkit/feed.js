// Simple list panel
// Dave Williams | https://dave.io | dave@dave.io

import { setLoading, showList, showError } from "dashkit/panel"

setLoading()

loadFeed()
  .then((articles) => {
    showList({ items: articles })
    console.log("Done")
  })
  .catch((error) => {
    showError(error)
    console.error(error)
  })

// Load the demo dashboard
async function loadFeed() {
  const response = await fetch("https://dave.io/api/dashboard/demo")
  const json = await response.json()
  return json.data.items
}
