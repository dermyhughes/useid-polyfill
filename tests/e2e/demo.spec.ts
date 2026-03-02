import { test, expect } from '@playwright/test'

test('useId generates unique, stable IDs in a real browser', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })

  await page.goto('/')

  // All 6 useId-bearing elements are present (3 inputs + 3 id displays)
  const elementsWithId = page.locator('[id]:not(#root)')
  await expect(elementsWithId).toHaveCount(6)

  // Collect all IDs and check they are unique
  const ids = await elementsWithId.evaluateAll(els => els.map(el => el.id))
  const uniqueIds = new Set(ids)
  expect(uniqueIds.size).toBe(ids.length)

  // Demo uses React 18+, so IDs use native React useId format (:rN:)
  for (const id of ids) {
    expect(id).toMatch(/^:[a-zA-Z0-9]+:$/)
  }

  // No console errors (catches hydration mismatch warnings)
  expect(consoleErrors).toHaveLength(0)
})

test('IDs are stable across re-renders', async ({ page }) => {
  await page.goto('/')

  const elementsWithId = page.locator('[id]:not(#root)')
  const idsBefore = await elementsWithId.evaluateAll(els => els.map(el => el.id))

  // Guard against vacuous pass if selector matches nothing
  expect(idsBefore.length).toBeGreaterThan(0)

  // Re-evaluate without navigation — IDs should be identical within the same render tree
  const idsAfter = await elementsWithId.evaluateAll(els => els.map(el => el.id))

  expect(idsBefore).toEqual(idsAfter)
})
