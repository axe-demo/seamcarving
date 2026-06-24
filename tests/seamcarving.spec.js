const { test, expect } = require('@playwright/test');

test.describe('Page structure', () => {
  test('index.html has title, canvas, and image gallery', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Seam Carving/);
    await expect(page.locator('#canvas')).toBeAttached();
    await expect(page.locator('#images')).toBeAttached();
  });
});

test.describe('SeamCarver algorithm', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test.html');
    // SeamCarver is assigned inside img.onload — wait for it
    await page.waitForFunction(() => window.seamCarver !== null, { timeout: 15000 });
  });

  test('initializes with image dimensions', async ({ page }) => {
    const result = await page.evaluate(() => ({
      width: seamCarver.image.width,
      height: seamCarver.image.height,
    }));
    expect(result.width).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThan(0);
  });

  test('computes heatmap', async ({ page }) => {
    const result = await page.evaluate(() => {
      seamCarver.initHeatMap();
      return {
        width: seamCarver.heatMap.length,
        height: seamCarver.heatMap[0].length,
        maxHeat: seamCarver.maxHeat,
      };
    });
    expect(result.width).toBe(await page.evaluate(() => seamCarver.image.width));
    expect(result.height).toBe(await page.evaluate(() => seamCarver.image.height));
    expect(result.maxHeat).toBeGreaterThan(0);
  });

  test('computes seams', async ({ page }) => {
    const seamCount = await page.evaluate(() => {
      seamCarver.initSeams();
      return seamCarver.seams.length;
    });
    const imageWidth = await page.evaluate(() => seamCarver.image.width);
    expect(seamCount).toBe(imageWidth);
  });

  test('resizes image by removing seams', async ({ page }) => {
    const result = await page.evaluate(() => {
      seamCarver.initSeams();
      const newWidth = seamCarver.image.width - 10;
      const resized = seamCarver.resize({ width: newWidth, height: seamCarver.image.height });
      return {
        width: resized.width,
        height: resized.height,
        dataLength: resized.data.length,
      };
    });
    expect(result.width).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThan(0);
    expect(result.dataLength).toBeGreaterThan(0);
  });

  test('getHeatMap returns pixel array', async ({ page }) => {
    const dataLength = await page.evaluate(() => {
      return seamCarver.initHeatMap().getHeatMap().length;
    });
    const expectedLength = await page.evaluate(
      () => seamCarver.image.width * seamCarver.image.height * 4
    );
    expect(dataLength).toBe(expectedLength);
  });

  test('getSeams returns pixel array', async ({ page }) => {
    const dataLength = await page.evaluate(() => {
      return seamCarver.initSeams().getSeams().length;
    });
    const expectedLength = await page.evaluate(
      () => seamCarver.image.width * seamCarver.image.height * 4
    );
    expect(dataLength).toBe(expectedLength);
  });
});
