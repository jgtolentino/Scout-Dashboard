import { test, expect } from '@playwright/test';

test('Interactive Tutorial Flow', async ({ page }) => {
  // Navigate to the dashboard
  await page.goto('http://localhost:8080/dashboard');

  // Click the 'Launch Tutorial' button
  await page.click('button:has-text("Launch Tutorial")');

  // Wait for the modal to appear
  await page.waitForSelector('.modal-overlay');

  // Verify the modal is visible
  const modalVisible = await page.isVisible('.modal-content');
  expect(modalVisible).toBeTruthy();

  // Check if the first tutorial step is displayed
  const firstStepTitle = await page.textContent('.modal-content h2');
  expect(firstStepTitle).toBeTruthy();

  // Click 'Next' to proceed to the next step
  await page.click('button:has-text("Next")');

  // Verify the second step is displayed
  const secondStepTitle = await page.textContent('.modal-content h2');
  expect(secondStepTitle).toBeTruthy();

  // Click 'Finish' to close the tutorial
  await page.click('button:has-text("Finish")');

  // Verify the modal is closed
  const modalClosed = await page.isHidden('.modal-overlay');
  expect(modalClosed).toBeTruthy();
});

test('Interactive Tutorial Flow with Previous Button', async ({ page }) => {
  // Navigate to the dashboard
  await page.goto('http://localhost:8080/dashboard');

  // Click the 'Launch Tutorial' button
  await page.click('button:has-text("Launch Tutorial")');

  // Wait for the modal to appear
  await page.waitForSelector('.modal-overlay');

  // Verify the modal is visible
  const modalVisible = await page.isVisible('.modal-content');
  expect(modalVisible).toBeTruthy();

  // Check if the first tutorial step is displayed
  const firstStepTitle = await page.textContent('.modal-content h2');
  expect(firstStepTitle).toBeTruthy();

  // Click 'Next' to proceed to the next step
  await page.click('button:has-text("Next")');

  // Verify the second step is displayed
  const secondStepTitle = await page.textContent('.modal-content h2');
  expect(secondStepTitle).toBeTruthy();

  // Click 'Previous' to go back to the first step
  await page.click('button:has-text("Previous")');

  // Verify the first step is displayed again
  const firstStepTitleAgain = await page.textContent('.modal-content h2');
  expect(firstStepTitleAgain).toBeTruthy();

  // Click 'Finish' to close the tutorial
  await page.click('button:has-text("Finish")');

  // Verify the modal is closed
  const modalClosed = await page.isHidden('.modal-overlay');
  expect(modalClosed).toBeTruthy();
});

test('Interactive Tutorial Flow with Close Button', async ({ page }) => {
  // Navigate to the dashboard
  await page.goto('http://localhost:8080/dashboard');

  // Click the 'Launch Tutorial' button
  await page.click('button:has-text("Launch Tutorial")');

  // Wait for the modal to appear
  await page.waitForSelector('.modal-overlay');

  // Verify the modal is visible
  const modalVisible = await page.isVisible('.modal-content');
  expect(modalVisible).toBeTruthy();

  // Click 'Close' to dismiss the tutorial
  await page.click('button:has-text("Close")');

  // Verify the modal is closed
  const modalClosed = await page.isHidden('.modal-overlay');
  expect(modalClosed).toBeTruthy();
}); 